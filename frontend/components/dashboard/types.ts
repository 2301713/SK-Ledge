export type Priority = "standard" | "urgent" | "event";
export type Audience = "all" | "chairpersons" | "treasurers" | "barangays";

export interface Broadcast {
  id: number;
  title: string;
  content: string;
  priority: Priority;
  audience: Audience;
  date: string;
  timestamp: string;
}

export interface BroadcastMemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitSuccess: () => void;
}

export interface ProposeProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitSuccess: () => void;
}
