'use server';

import { z } from 'zod';
import { sql } from '@vercel/postgres'
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { signIn } from '@/auth'
import { AuthError } from 'next-auth';
import bcrypt from 'bcrypt';

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string({
    invalid_type_error: 'Please select a customer',
  }),
  amount: z.coerce.number().gt(0, { message: 'Please enter an amount greater than $0.' }),
  status: z.enum(['pending', 'paid'], {
    invalid_type_error: 'Please select an invoice status.',
  }),
  date: z.string(),
})

const UserFormSchema = z.object({
  id: z.string(),
  name: z.string({
    invalid_type_error: 'Please enter your name.'
  }),
  email: z
    .string()
    .min(1, { message: "This field has to be filled." })
    .email("This is not a valid email."),
  password: z.string().min(8, { message: "Must be at least 8 characters long." })
})

const ExpenseFormSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  amount: z.coerce.number({ required_error: 'Please enter the amount you spent.' }),
  description: z.string({ invalid_type_error: 'Please enter a valid description.' }),
  spent_date: z.string({ required_error: 'Please enter the date when you spent this expense.' })
})

export type invoiceState = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};

export type userState = {
  errors?: {
    name?: string[];
    email?: string[];
    password?: string[];
  };
  message: string;
} | {
  message: string;
  errors?: undefined;
}

export type expenseState = {
  errors?: {
    id?: string[];
    user_id?: string[];
    amount?: string[];
    description?: string[];
    spent_date?: string[];
  };
  message: string | null;
}

const CreateInvoice = FormSchema.omit({ id: true, date: true });
const UpdateInvoice = FormSchema.omit({ id: true, date: true });
const SignUp = UserFormSchema.omit({ id: true })
const CreateExpense = ExpenseFormSchema.omit({ id: true })
const UpdateExpense = ExpenseFormSchema.omit({ id: true })

export async function createExpense(prevState: expenseState, formData: FormData) {
  const validateFields = CreateExpense.safeParse({
    user_id: formData.get('user_id'),
    amount: formData.get('amount'),
    description: formData.get('description'),
    spent_date: formData.get('spent_date')
  })

  if (!validateFields.success) {
    return {
      errors: validateFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Expense.'
    }
  }

  const { user_id, amount, description, spent_date } = validateFields.data;
  const created_at = new Date().toISOString().split('T')[0];
  const updated_at = new Date().toISOString().split('T')[0];
  // const session = await auth()
  // const user = await sql`SELECT * from users where email=${session?.user?.email}`

  try {
    await sql`INSERT INTO expenses (user_id, amount, description, spent_date, created_at, updated_at)
                VALUES(${user_id}, ${amount}, ${description}, ${spent_date}, ${created_at}, ${updated_at})`;
  } catch (e) {
    return {
      message: 'Database Error: Failed to Create Expense.'
    }
  }

  revalidatePath('/dashboard/expenses');
  redirect('/dashboard/expenses')

}

export async function updateExpense(id: string, prevState: expenseState, formData: FormData) {
  const validateFields = UpdateExpense.safeParse({
    user_id: formData.get('user_id'),
    amount: formData.get('amount'),
    description: formData.get('description'),
    spent_date: formData.get('spent_date')
  })

  if (!validateFields.success) {
    return {
      errors: validateFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Expense.'
    }
  }

  const { user_id, amount, description, spent_date } = validateFields.data;
  const updated_at = new Date().toISOString();

  try {
    await sql`UPDATE expenses
              SET user_id=${user_id}, 
                  amount=${amount}, 
                  description=${description}, 
                  spent_date=${spent_date},
                  updated_at=${updated_at}
              WHERE id=${id}`;
  } catch (e) {
    return {
      message: 'Database Error: Failed to Update Expense.'
    }
  }

  revalidatePath('/dashboard/expenses');
  redirect('/dashboard/expenses')

}

export async function deleteExpense(id: string) {
  // throw new Error('Failed to Delete Invoice');

  try {
    await sql`DELETE FROM expenses WHERE id = ${id}`;
  } catch (e) {
    return {
      message: 'Database Error: Failed to Delete Invoice.'
    }
  }

  revalidatePath('/dashboard/expenses');
}


export async function createInvoice(prevState: invoiceState, formData: FormData) {
  const validatedFields = CreateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Invoice.',
    };
  }

  // Prepare data for insertion into the database
  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0];

  try {
    await sql`INSERT INTO invoices (customer_id, amount, status, date)
                    VALUES(${customerId}, ${amountInCents}, ${status}, ${date})
            `;
  } catch (e) {
    return {
      message: 'Database Error: Failed to Create Invoice.'
    }
  }


  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices')
}

export async function updateInvoice(id: string, prevState: invoiceState, formData: FormData) {
  const validatedFields = UpdateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Update Invoice.',
    };
  }

  // Prepare data for insertion into the database
  const { customerId, amount, status } = validatedFields.data;


  const amountInCents = amount * 100;

  try {
    await sql`
        UPDATE invoices
        SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
        WHERE id = ${id}`;
  } catch (e) {
    return {
      message: 'Database Error: Failed to Update Invoice.'
    }
  }


  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
  // throw new Error('Failed to Delete Invoice');

  try {
    await sql`DELETE FROM invoices WHERE id = ${id}`;
  } catch (e) {
    return {
      message: 'Database Error: Failed to Delete Invoice.'
    }
  }

  revalidatePath('/dashboard/invoices');
}

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn('credentials', formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        default:
          return 'Something went wrong.';
      }
    }
    throw error;
  }
  revalidatePath('/dashboard')
  redirect('/dashboard')
}

export async function signUp(
  prevState: userState | undefined,
  formData: FormData
) {
  const validatedFields = SignUp.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Sign Up.',
    };
  }

  // Prepare data for insertion into the database
  const { name, email, password } = validatedFields.data;
  const salt = await bcrypt.genSalt()
  const encryptedPassword = await bcrypt.hash(password, salt)

  try {
    await sql`INSERT INTO users (name, email, password)
                        VALUES(${name}, ${email}, ${encryptedPassword})
                `;
  } catch (e) {
    return {
      message: 'Database Error: Failed to User.'
    }
  }

  revalidatePath('/dashboard');
  redirect('/dashboard');
}