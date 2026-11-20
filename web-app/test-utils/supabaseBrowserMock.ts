import {
  buildSupabaseModule,
  type SupabaseMockState,
} from "./supabaseMock";

/**
 * Browser-client shape of the Supabase mock: the server helper only exposes
 * `createClient`, while pages import a singleton `supabase` with `auth`.
 * The state is read lazily so tests can reset it between renders.
 */
export function buildSupabaseBrowserModule(ref: {
  state: SupabaseMockState;
}) {
  const getState = (): SupabaseMockState => {
    if (!ref.state) {
      throw new Error("Supabase browser mock state was not initialized.");
    }
    return ref.state;
  };

  return {
    supabase: {
      from: (table: string) =>
        buildSupabaseModule(getState()).createClient().from(table),
      auth: {
        getUser: async () => {
          const state = getState();
          return {
            data: { user: state.authUser },
            error: state.authError,
          };
        },
      },
    },
  };
}
