import {
  BanknotesIcon,
  ClockIcon,
  UserGroupIcon,
  InboxIcon,
  CurrencyDollarIcon,
  MinusCircleIcon,
  BuildingLibraryIcon,
} from '@heroicons/react/24/outline';
import { lusitana } from '@/app/ui/fonts';
import { fetchCardData } from '@/app/lib/data';

const iconMap = {
  collected: BuildingLibraryIcon,
  customers: UserGroupIcon,
  pending: ClockIcon,
  expenses: InboxIcon,
  dailyIncome: CurrencyDollarIcon,
  spent: MinusCircleIcon
};

export default async function CardWrapper() {
  const {
    numberOfInvoices,
    numberOfCustomers,
    totalPaidInvoices,
    totalPendingInvoices,
    numberOfExpenses,
    totalExpenses,
    expenseDaily,
    monthlyLeft
  } = await fetchCardData();
  return (
    <>
      {/* NOTE: comment in this code when you get to this point in the course */}

      <Card title="Monthly Saved" value={monthlyLeft} type="collected" />
      <Card
        title="Daily Income"
        value={expenseDaily}
        type="dailyIncome"
      />
      <Card title="Spent" value={totalExpenses} type="spent" />
      <Card title="# of Expenses" value={numberOfExpenses} type="expenses" />
    </>
  );
}

export function Card({
  title,
  value,
  type,
}: {
  title: string;
  value: number | string;
  type: 'expenses' | 'collected' | 'dailyIncome' | 'spent';
}) {
  const Icon = iconMap[type];

  return (
    <div className="rounded-xl bg-gray-50 p-2 shadow-sm">
      <div className="flex p-4">
        {Icon ? <Icon className="h-5 w-5 text-gray-700" /> : null}
        <h3 className="ml-2 text-sm font-medium">{title}</h3>
      </div>
      <p
        className={`${lusitana.className}
          truncate rounded-xl bg-white px-4 py-8 text-center text-2xl`}
      >
        {value}
      </p>
    </div>
  );
}
