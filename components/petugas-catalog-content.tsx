"use client";

import { CatalogBrowser } from "@/components/catalog-browser";
import {
  AddBookDialog,
  AddThesisDialog,
  DeleteCollectionDialog,
  EditCollectionDialog,
} from "@/components/catalog-crud-dialogs";
import type { Book, Thesis } from "@/lib/types";

export function PetugasCatalogContent({
  books,
  theses,
}: {
  books: Book[];
  theses: Thesis[];
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
        <AddBookDialog />
        <AddThesisDialog />
      </div>
      <CatalogBrowser
        books={books}
        theses={theses}
        itemActions={(item) => (
          <>
            <EditCollectionDialog item={item} />
            <DeleteCollectionDialog item={item} />
          </>
        )}
      />
    </div>
  );
}
