import Form from '@/app/ui/expenses/create-form';
import Breadcrumbs from '@/app/ui/invoices/breadcrumbs';
import { fetchCustomers } from '@/app/lib/data';
import { auth } from '@/auth';
import { sql } from '@vercel/postgres';
 
export default async function Page() {
  const customers = await fetchCustomers();
    const session = await auth()
  const user = await sql`SELECT * from users where email=${session?.user?.email}`
 
  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: 'Expense', href: '/dashboard/expenses' },
          {
            label: 'Create Expense',
            href: '/dashboard/expenses/create',
            active: true,
          },
        ]}
      />
      <Form user_id={user?.rows[0].id}/>
    </main>
  );
}