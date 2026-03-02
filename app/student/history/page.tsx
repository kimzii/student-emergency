"use client";

import { Card } from "../../../components/ui/card";

export default function StudentHistoryPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center py-8 px-4">
      <Card className="w-full max-w-md p-8 flex flex-col items-center">
        <h1 className="text-2xl font-bold mb-4 text-center">History</h1>
        <p className="text-gray-600">
          This is a placeholder for the student history page.
        </p>
      </Card>
    </main>
  );
}
