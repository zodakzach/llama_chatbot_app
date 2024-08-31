import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "./Dialog";

export function ClearChatsDialog({
  handleDeleteAll,
}: {
  handleDeleteAll: () => void;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="mt-auto w-full rounded-lg bg-secondary/10 p-2 text-text hover:bg-secondary/20">
          Clear Chats
        </button>
      </DialogTrigger>
      <DialogContent className="bg-primary text-text">
        <DialogHeader>
          <DialogTitle>Clear All Chats</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete all chat threads? This action cannot
            be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <button className="rounded-lg p-2 hover:bg-secondary/10">
              Cancel
            </button>
          </DialogClose>
          <DialogClose asChild>
            <button
              className="rounded-lg bg-red-600 p-2 text-text hover:bg-red-700"
              onClick={handleDeleteAll}
            >
              Delete All
            </button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
