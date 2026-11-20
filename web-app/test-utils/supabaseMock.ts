/**
 * Small in-memory stand-in for the parts of the Supabase client used by the
 * route handlers. Tests configure rows plus per-table/per-operation errors and
 * then assert on the payloads the handler produced.
 */

export type TableRow = Record<string, unknown>;

export type QueryError = { code?: string; message?: string } | null;

type Operation = "select" | "insert" | "update" | "upsert";

/**
 * Runs immediately before a query resolves, so a test can simulate state that
 * changes between two queries of the same kind (a concurrent writer, a failure
 * that only affects the second call, ...). `call` is 1-based per table+operation.
 */
export type QueryHook = (info: {
  table: string;
  operation: Operation;
  call: number;
}) => void;

export type StorageMockState = {
  buckets: string[];
  createdBuckets: { name: string; options?: Record<string, unknown> }[];
  createBucketError: { message?: string } | null;
  uploads: {
    bucket: string;
    path: string;
    file: unknown;
    options?: unknown;
  }[];
  uploadError: { message?: string } | null;
  signedUrls: Record<string, string>;
  signedUrlError: { message?: string } | null;
  signedUrlRequests: { bucket: string; path: string; expiresIn: number }[];
};

export type SupabaseMockState = {
  authUser: {
    id: string;
    email?: string;
    user_metadata?: Record<string, unknown>;
  } | null;
  authError: { status?: number; message?: string } | null;
  rows: Record<string, TableRow[]>;
  errors: Record<string, QueryError>;
  insertResults: Record<string, TableRow | null | undefined>;
  upsertResults: Record<string, TableRow | null | undefined>;
  inserted: { table: string; rows: TableRow[] }[];
  updated: { table: string; patch: TableRow }[];
  upserted: { table: string; row: TableRow }[];
  selectedColumns: { table: string; columns: string }[];
  filterCalls: { table: string; column: string; value: unknown; mode: Filter["mode"] }[];
  queryCounts: Record<string, number>;
  onQuery: QueryHook | null;
  storage: StorageMockState;
};

export function createSupabaseMockState(): SupabaseMockState {
  return {
    authUser: null,
    authError: null,
    rows: {},
    errors: {},
    insertResults: {},
    upsertResults: {},
    inserted: [],
    updated: [],
    upserted: [],
    selectedColumns: [],
    filterCalls: [],
    queryCounts: {},
    onQuery: null,
    storage: {
      buckets: [],
      createdBuckets: [],
      createBucketError: null,
      uploads: [],
      uploadError: null,
      signedUrls: {},
      signedUrlError: null,
      signedUrlRequests: [],
    },
  };
}

type Filter = { column: string; value: unknown; mode: "eq" | "neq" | "ilike" };

function matches(row: TableRow, filter: Filter): boolean {
  const actual = row[filter.column];
  const expected = filter.value;

  if (filter.mode === "ilike") {
    return (
      typeof actual === "string" &&
      typeof expected === "string" &&
      actual.toLowerCase() === expected.toLowerCase()
    );
  }

  const equal = actual === expected;
  return filter.mode === "eq" ? equal : !equal;
}

function makeBuilder(state: SupabaseMockState, table: string) {
  const filters: Filter[] = [];
  let operation: Operation = "select";
  let payload: unknown;
  let limit: number | null = null;

  const matchesFilters = (row: TableRow) =>
    filters.every((filter) => matches(row, filter));

  const filteredRows = () => {
    const rows = (state.rows[table] ?? []).filter(matchesFilters);
    return limit === null ? rows : rows.slice(0, limit);
  };

  const errorFor = (op: Operation) => state.errors[`${table}:${op}`] ?? null;

  const result = (asSingle: boolean): { data: unknown; error: QueryError } => {
    const key = `${table}:${operation}`;
    const call = (state.queryCounts[key] ?? 0) + 1;
    state.queryCounts[key] = call;
    state.onQuery?.({ table, operation, call });

    const error = errorFor(operation);
    if (error) return { data: null, error };

    if (operation === "insert" || operation === "upsert") {
      const rows = Array.isArray(payload) ? payload : [payload];
      const record = rows[0] as TableRow;
      const configured =
        operation === "insert"
          ? state.insertResults[table]
          : state.upsertResults[table];
      const data =
        configured !== undefined && configured !== null
          ? configured
          : { ...record };

      if (operation === "insert") {
        state.inserted.push({ table, rows: rows as TableRow[] });
        (state.rows[table] ??= []).push(...(rows as TableRow[]));
      } else {
        state.upserted.push({ table, row: record });
      }

      return { data: asSingle ? data : [data], error: null };
    }

    if (operation === "update") {
      const patch = payload as TableRow;
      state.updated.push({ table, patch });
      for (const row of state.rows[table] ?? []) {
        if (matchesFilters(row)) Object.assign(row, patch);
      }
      return { data: null, error: null };
    }

    const rows = filteredRows();
    return { data: asSingle ? (rows[0] ?? null) : rows, error: null };
  };

  const builder: Record<string, unknown> = {
    select(columns = "*") {
      state.selectedColumns.push({ table, columns });
      return builder;
    },
    insert(rows: unknown) {
      operation = "insert";
      payload = rows;
      return builder;
    },
    update(patch: unknown) {
      operation = "update";
      payload = patch;
      return builder;
    },
    upsert(row: unknown) {
      operation = "upsert";
      payload = row;
      return builder;
    },
    eq(column: string, value: unknown) {
      filters.push({ column, value, mode: "eq" });
      state.filterCalls.push({ table, column, value, mode: "eq" });
      return builder;
    },
    neq(column: string, value: unknown) {
      filters.push({ column, value, mode: "neq" });
      state.filterCalls.push({ table, column, value, mode: "neq" });
      return builder;
    },
    ilike(column: string, value: unknown) {
      filters.push({ column, value, mode: "ilike" });
      state.filterCalls.push({ table, column, value, mode: "ilike" });
      return builder;
    },
    order() {
      return builder;
    },
    limit(count: number) {
      limit = count;
      return builder;
    },
    maybeSingle: async () => result(true),
    single: async () => result(true),
    then: (
      resolve: (value: { data: unknown; error: QueryError }) => unknown,
      reject?: (reason: unknown) => unknown,
    ) => Promise.resolve(result(false)).then(resolve, reject),
  };

  return builder;
}

function makeStorage(state: SupabaseMockState) {
  return {
    async getBucket(name: string) {
      return {
        data: state.storage.buckets.includes(name) ? { name } : null,
        error: null,
      };
    },
    async createBucket(name: string, options?: Record<string, unknown>) {
      if (state.storage.createBucketError) {
        return { data: null, error: state.storage.createBucketError };
      }
      state.storage.buckets.push(name);
      state.storage.createdBuckets.push({ name, options });
      return { data: { name }, error: null };
    },
    from(bucket: string) {
      return {
        async upload(path: string, file: unknown, options?: unknown) {
          state.storage.uploads.push({ bucket, path, file, options });
          return state.storage.uploadError
            ? { data: null, error: state.storage.uploadError }
            : { data: { path }, error: null };
        },
        async createSignedUrl(path: string, expiresIn: number) {
          state.storage.signedUrlRequests.push({ bucket, path, expiresIn });
          if (state.storage.signedUrlError) {
            return { data: null, error: state.storage.signedUrlError };
          }
          const signedUrl = state.storage.signedUrls[path];
          return signedUrl
            ? { data: { signedUrl }, error: null }
            : { data: null, error: null };
        },
      };
    },
  };
}

export function buildSupabaseModule(state: SupabaseMockState) {
  return {
    createClient: () => ({
      from: (table: string) => makeBuilder(state, table),
      storage: makeStorage(state),
    }),
  };
}

export function buildSupabaseServerModule(state: SupabaseMockState) {
  return {
    createServerClient: () => ({
      auth: {
        getUser: async () => ({
          data: { user: state.authUser },
          error: state.authError,
        }),
      },
    }),
  };
}
