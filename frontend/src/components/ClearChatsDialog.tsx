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
        <button className="mt-auto w-full rounded-lg bg-gray-600 p-2 text-white hover:bg-gray-700">
          Clear Chats
        </button>
      </DialogTrigger>
      <DialogContent className="bg-gray-800 text-white">
        <DialogHeader>
          <DialogTitle>Clear All Chats</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete all chat threads? This action cannot
            be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <button className="rounded-lg p-2 hover:bg-gray-200">Cancel</button>
          </DialogClose>
          <DialogClose asChild>
            <button
              className="rounded-lg bg-red-600 p-2 text-white hover:bg-red-700"
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
