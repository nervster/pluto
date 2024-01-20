'use client';

import Link from 'next/link';
import {
  CalendarDaysIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/app/ui/button';
import { updateExpense } from '@/app/lib/actions'
import { useFormState } from 'react-dom';
import { formatDateForInput } from '@/app/lib/utils';
import { ExpenseForm } from '@/app/lib/definitions';

export default function Form({ expense, user_id }: { expense: ExpenseForm, user_id: string }) {
  const initialState = { message: null, errors: {} };
  const updateExpenseWithId = updateExpense.bind(null, expense.id);

  const [state, dispatch] = useFormState(updateExpenseWithId, initialState)

  return (
    <form action={dispatch}>  
      <div className="rounded-md bg-gray-50 p-4 md:p-6">
      <input id='user_id' name='user_id' type="hidden" value={user_id}></input>
        {/* Invoice Amount */}
        <div className="mb-4">
          <label htmlFor="amount" className="mb-2 block text-sm font-medium">
            Choose an amount
          </label>
          <div className="relative mt-2 rounded-md">
            <div className="relative">
              <input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                placeholder="Enter USD amount"
                className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
                defaultValue={expense.amount}
                required
              />
              <CurrencyDollarIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
            </div>
          </div>
        </div>

        {/* Expense Date */}
        <div className="mb-4">
          <label htmlFor="spent_date" className="mb-2 block text-sm font-medium">
            Expense Date
          </label>
          <div className="relative mt-2 rounded-md">
            <div className="relative">
              <input
                id="spent_date"
                name="spent_date"
                type="date"
                className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
                defaultValue={formatDateForInput(expense.spent_date)}
                required
              />
              <CalendarDaysIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mb-4">
          <label htmlFor="description" className="mb-2 block text-sm font-medium">
            Description
          </label>
          <div className="relative mt-2 rounded-md">
            <div className="relative">
              <input
                id="description"
                name="description"
                type="text"
                className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
                defaultValue={expense.description ?? ''}
              />
              <DocumentTextIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
            </div>
          </div>
        </div>

      </div>
      <div className="mt-6 flex justify-end gap-4">
        <Link
          href="/dashboard/expenses"
          className="flex h-10 items-center rounded-lg bg-gray-100 px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
        >
          Cancel
        </Link>
        <Button type="submit">Add Expense</Button>
      </div>
    </form>
  );
}
