import { QueryResultRow, sql } from '@vercel/postgres';
import {
  CustomerField,
  CustomersTableType,
  InvoiceForm,
  InvoicesTable,
  LatestInvoiceRaw,
  User,
  Revenue,
  LatestExpenseRaw,
  ExpenseTable,
  ExpenseForm
} from './definitions';
import { formatCurrency } from './utils';
import { unstable_noStore as noStore } from 'next/cache';
import { auth } from "../../auth"

export async function getSessionUser(): Promise<QueryResultRow> {
  const session = await auth();
  const user = await sql`SELECT * from users where email=${session?.user?.email}`;
  return user;
}



export async function fetchRevenue() {
  // Add noStore() here to prevent the response from being cached.
  // This is equivalent to in fetch(..., {cache: 'no-store'}).
  noStore();

  try {
    // Artificially delay a response for demo purposes.
    // Don't do this in production :)

    // console.log('Fetching revenue data...');
    // await new Promise((resolve) => setTimeout(resolve, 3000));

    const data = await sql<Revenue>`SELECT * FROM revenue`;

    // console.log('Data fetch completed after 3 seconds.');

    return data.rows;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch revenue data.');
  }
}

export async function fetchLatestInvoices() {
  noStore();
  try {
    const data = await sql<LatestInvoiceRaw>`
      SELECT invoices.amount, customers.name, customers.image_url, customers.email, invoices.id
      FROM invoices
      JOIN customers ON invoices.customer_id = customers.id
      ORDER BY invoices.date DESC
      LIMIT 5`;

    const latestInvoices = data.rows.map((invoice) => ({
      ...invoice,
      amount: formatCurrency(invoice.amount),
    }));
    return latestInvoices;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch the latest invoices.');
  }
}

export async function fetchLatestExpenses() {
  noStore();
  const user = await getSessionUser();
  try {
    const data = await sql<LatestExpenseRaw>`
      SELECT *
      FROM expenses
      WHERE user_id = ${user?.rows[0].id}
      ORDER BY spent_date DESC
      LIMIT 5`;

    const latestExpenses = data.rows.map((expense) => ({
      ...expense,
      amount: formatCurrency(expense.amount * 100),
    }));
    return latestExpenses;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch the latest invoices.');
  }
}


export async function fetchCardData() {
  noStore();
  const session = await auth()
  const user = await sql`SELECT * from users where email=${session?.user?.email}`
  try {
    // You can probably combine these into a single SQL query
    // However, we are intentionally splitting them to demonstrate
    // how to initialize multiple queries in parallel with JS.
    const invoiceCountPromise = sql`SELECT COUNT(*) FROM invoices`;
    const customerCountPromise = sql`SELECT COUNT(*) FROM customers`;
    const invoiceStatusPromise = sql`SELECT
         SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) AS "paid",
         SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) AS "pending"
         FROM invoices`;
    const expenseCount = sql`SELECT count(*) from expenses where user_id=${user?.rows[0].id} and EXTRACT(MONTH FROM updated_at) =${new Date(Date.now()).getMonth() + 1}`
    const expenseAmount = sql`SELECT SUM(amount) AS "expenses_amt" from expenses where user_id=${user?.rows[0].id} and EXTRACT(MONTH FROM updated_at) = ${new Date(Date.now()).getMonth() + 1}`
    const dailyExpense = sql`SELECT ROUND(amount/EXTRACT(DAY FROM (date_trunc('MONTH', CURRENT_DATE) + INTERVAL '1 MONTH' - INTERVAL '1 day')),2) as "daily" from monthly_budgets
                              WHERE user_id=${user?.rows[0].id}
                              order by created_at desc
                              limit 1`;
    const monthlySaved = sql`SELECT (amount/EXTRACT(DAY FROM (date_trunc('MONTH', CURRENT_DATE) + INTERVAL '1 MONTH' - INTERVAL '1 day'))) 
                              * EXTRACT(DAY FROM  CURRENT_DATE) as monthly_accumulated
                              FROM monthly_budgets
                              WHERE user_id=${user?.rows[0].id}
                              order by created_at desc
                              limit 1`;

    const data = await Promise.all([
      invoiceCountPromise,
      customerCountPromise,
      invoiceStatusPromise,
      expenseCount,
      expenseAmount,
      dailyExpense,
      monthlySaved
    ]);

    const numberOfInvoices = Number(data[0].rows[0].count ?? '0');
    const numberOfCustomers = Number(data[1].rows[0].count ?? '0');
    const totalPaidInvoices = formatCurrency(data[2].rows[0].paid ?? '0');
    const totalPendingInvoices = formatCurrency(data[2].rows[0].pending ?? '0');

    const numberOfExpenses = Number(data[3].rows[0].count ?? '0');
    const totalExpenses = formatCurrency(data[4].rows[0].expenses_amt * 100 ?? '0');
    const expenseDaily = formatCurrency(data[5].rows[0].daily * 100 ?? '0')
    const monthlyLeft = formatCurrency((data[6].rows[0].monthly_accumulated - data[4].rows[0].expenses_amt) * 100 ?? '0')

    return {
      numberOfCustomers,
      numberOfInvoices,
      totalPaidInvoices,
      totalPendingInvoices,
      numberOfExpenses,
      totalExpenses,
      expenseDaily,
      monthlyLeft
    };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch card data.');
  }
}

const ITEMS_PER_PAGE = 10;
export async function fetchFilteredExpenses(
  query: string,
  currentPage: number,
) {
  noStore();
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;
  const user = await getSessionUser();

  try {
    const expenses = await sql<ExpenseTable>`
      SELECT
        expenses.id,
        expenses.amount,
        expenses.spent_date,
        expenses.description,
        expenses.updated_at
      FROM expenses
      WHERE
        user_id = ${user?.rows[0].id} AND 
        (expenses.amount::text ILIKE ${`%${query}%`} OR
        expenses.spent_date::text ILIKE ${`%${query}%`} OR
        expenses.description ILIKE ${`%${query}%`})
      ORDER BY expenses.updated_at DESC
      LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset}
    `;

    return expenses.rows;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch expenses.');
  }
}
export async function fetchFilteredInvoices(
  query: string,
  currentPage: number,
) {
  noStore();
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;
  try {
    const invoices = await sql<InvoicesTable>`
      SELECT
        invoices.id,
        invoices.amount,
        invoices.date,
        invoices.status,
        customers.name,
        customers.email,
        customers.image_url
      FROM invoices
      JOIN customers ON invoices.customer_id = customers.id
      WHERE
        customers.name ILIKE ${`%${query}%`} OR
        customers.email ILIKE ${`%${query}%`} OR
        invoices.amount::text ILIKE ${`%${query}%`} OR
        invoices.date::text ILIKE ${`%${query}%`} OR
        invoices.status ILIKE ${`%${query}%`}
      ORDER BY invoices.date DESC
      LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset}
    `;

    return invoices.rows;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoices.');
  }
}

export async function fetchExpensePages(query: string) {
  noStore();
  const user = await getSessionUser();
  try {
    const count = await sql`SELECT COUNT(*)
  FROM expenses
  WHERE
    user_id = ${user?.rows[0].id} AND 
    (expenses.amount::text ILIKE ${`%${query}%`} OR
    expenses.spent_date::text ILIKE ${`%${query}%`} OR
    expenses.description ILIKE ${`%${query}%`})
  `;

    const totalPages = Math.ceil(Number(count.rows[0].count) / ITEMS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of expenses.');
  }
}

export async function fetchInvoicesPages(query: string) {
  noStore();
  try {
    const count = await sql`SELECT COUNT(*)
    FROM invoices
    JOIN customers ON invoices.customer_id = customers.id
    WHERE
      customers.name ILIKE ${`%${query}%`} OR
      customers.email ILIKE ${`%${query}%`} OR
      invoices.amount::text ILIKE ${`%${query}%`} OR
      invoices.date::text ILIKE ${`%${query}%`} OR
      invoices.status ILIKE ${`%${query}%`}
  `;

    const totalPages = Math.ceil(Number(count.rows[0].count) / ITEMS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of invoices.');
  }
}

export async function fetchInvoiceById(id: string) {
  noStore();
  try {
    const data = await sql<InvoiceForm>`
      SELECT
        invoices.id,
        invoices.customer_id,
        invoices.amount,
        invoices.status
      FROM invoices
      WHERE invoices.id = ${id};
    `;

    const invoice = data.rows.map((invoice) => ({
      ...invoice,
      // Convert amount from cents to dollars
      amount: invoice.amount / 100,
    }));

    return invoice[0];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoice.');
  }
}

export async function fetchExpenseById(id: string) {
  noStore();
  try {
    const data = await sql<ExpenseForm>`
      SELECT
        id,
        user_id,
        amount,
        description,
        spent_date
      FROM expenses
      WHERE id = ${id};
    `;

    const expense = data.rows.map((exp) => ({
      ...exp
    }));

    return expense[0];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch expense.');
  }
}

export async function fetchCustomers() {
  noStore();
  try {
    const data = await sql<CustomerField>`
      SELECT
        id,
        name
      FROM customers
      ORDER BY name ASC
    `;

    const customers = data.rows;
    return customers;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch all customers.');
  }
}

export async function fetchFilteredCustomers(query: string) {
  noStore();
  try {
    const data = await sql<CustomersTableType>`
		SELECT
		  customers.id,
		  customers.name,
		  customers.email,
		  customers.image_url,
		  COUNT(invoices.id) AS total_invoices,
		  SUM(CASE WHEN invoices.status = 'pending' THEN invoices.amount ELSE 0 END) AS total_pending,
		  SUM(CASE WHEN invoices.status = 'paid' THEN invoices.amount ELSE 0 END) AS total_paid
		FROM customers
		LEFT JOIN invoices ON customers.id = invoices.customer_id
		WHERE
		  customers.name ILIKE ${`%${query}%`} OR
        customers.email ILIKE ${`%${query}%`}
		GROUP BY customers.id, customers.name, customers.email, customers.image_url
		ORDER BY customers.name ASC
	  `;

    const customers = data.rows.map((customer) => ({
      ...customer,
      total_pending: formatCurrency(customer.total_pending),
      total_paid: formatCurrency(customer.total_paid),
    }));

    return customers;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch customer table.');
  }
}

export async function getUser(email: string) {
  noStore();
  try {
    const user = await sql`SELECT * FROM users WHERE email=${email}`;
    return user.rows[0] as User;
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw new Error('Failed to fetch user.');
  }
}
