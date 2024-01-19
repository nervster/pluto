'use server';

import { z } from 'zod';
import { sql } from '@vercel/postgres'
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {signIn} from '@/auth'
import { AuthError } from 'next-auth';
import { getUser } from './data';
import bcrypt from 'bcrypt';

const FormSchema = z.object({
    id: z.string(),
    customerId: z.string({
        invalid_type_error: 'Please select a customer',
    }),
    amount: z.coerce.number().gt(0, {message: 'Please enter an amount greater than $0.'}),
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
    password: z.string().min(8, {message: "Must be at least 8 characters long."})
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
    name: string[];
    email?: string[];
    password?: string[];
  };
  message?: string | null;
}

const CreateInvoice = FormSchema.omit({ id: true, date: true });
const UpdateInvoice = FormSchema.omit({ id: true, date: true });
const SignUp = UserFormSchema.omit({id: true})


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
    } catch(e) {
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
        WHERE id = ${id}
      `;
    } catch(e) {
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
    } catch(e) {
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
  }

  export async function signUp(
    prevState: string | undefined,
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
        } catch(e) {
            return {
                message: 'Database Error: Failed to User.'
            }
        }

    revalidatePath('/dashboard');
    redirect('/dashboard');
  }