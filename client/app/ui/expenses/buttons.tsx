import { deleteExpense } from '@/app/lib/actions';
import { PencilIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export function CreateExpense({show=true}: {show?: boolean}) {

  return (
    <Link
      href="/dashboard/expenses/create"
      className="flex h-10 items-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
    >
      {show ? <span className="hidden md:block">Create Expense</span> : null }{' '}
      <PlusIcon className={`h-5 ${show ? 'md:ml-4' : 'm-0'} `} />
    </Link>
  );
}

export function UpdateExpense({ id }: { id: string }) {
  return (
    <Link
      href={`/dashboard/expenses/${id}/edit`}
      className="rounded-md border p-2 hover:bg-gray-100"
    >
      <PencilIcon className="w-5" />
    </Link>
  );
}

export function DeleteExpense({ id }: { id: string }) {
  const deleteExpenseWithId = deleteExpense.bind(null, id)
  return (
    <>
    <form action={deleteExpenseWithId}>
    <button className="rounded-md border p-2 hover:bg-gray-100">
        <span className="sr-only">Delete</span>
        <TrashIcon className="w-5" />
      </button>
    </form>
    </>
  );
}
