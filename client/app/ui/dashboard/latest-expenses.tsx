import { ArrowPathIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import Image from 'next/image';
import { lusitana } from '@/app/ui/fonts';
import { LatestExpense } from '@/app/lib/definitions';
import { fetchLatestExpenses, fetchLatestInvoices } from '@/app/lib/data';
import { CreateExpense } from '../expenses/buttons';


export default async function LatestExpenses() {
  const latestExpenses = await fetchLatestExpenses();
  const options: Intl.DateTimeFormatOptions = {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: true,
    timeZoneName: 'short',
  };
  return (
    <div className="flex w-full flex-col md:col-span-4">
      <div className="flex flex-row justify-between">
        <h2 className={`${lusitana.className} mb-4 text-xl md:text-2xl`}>
          Latest Expenses
        </h2>
        <CreateExpense show={false}/>
      </div>
      
      <div className="flex grow flex-col justify-between rounded-xl bg-gray-50 p-4">
        {/* NOTE: comment in this code when you get to this point in the course */}

        {<div className="bg-white px-6">
          {latestExpenses.map((expense, i) => {
            const dateSpent = new Date(expense.spent_date)
            return (
              <div
                key={expense.id}
                className={clsx(
                  'flex flex-row items-center justify-between py-4',
                  {
                    'border-t': i !== 0,
                  },
                )}
              >
                <div className="flex items-center">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold md:text-base">
                      {expense.description ?? "No Description"}
                    </p>
                    <p className="hidden text-sm text-gray-500 sm:block">
                      {new Date(dateSpent).toLocaleString('en-US', options)}
                    </p>
                  </div>
                </div>
                <p
                  className={`${lusitana.className} truncate text-sm font-medium md:text-base`}
                >
                  {expense.amount}
                </p>
              </div>
            );
          })}
        </div>}
        <div className="flex items-center pb-2 pt-6">
          <ArrowPathIcon className="h-5 w-5 text-gray-500" />
          <h3 className="ml-2 text-sm text-gray-500 ">Updated just now</h3>
        </div>
      </div>
    </div>
  );
}
