import PlutoLogo from '@/app/ui/pluto-logo';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { lusitana, inter } from './ui/fonts';
import Image from 'next/image'

export default function Page() {
  return (
    <main className="flex min-h-screen flex-col p-6">
      <div className="flex h-20 shrink-0 items-end rounded-lg bg-blue-500 p-4 md:h-30">
        <PlutoLogo />
      </div>
      <div className="mt-4 flex grow flex-col gap-4 md:flex-row">
        <div className="flex flex-col justify-center gap-6 rounded-lg bg-gray-50 px-6 py-10 md:w-2/5 md:px-20">
          <p className={`${lusitana.className} text-xl text-gray-800 md:text-3xl md:leading-normal`}>
            <strong>Welcome to Pluto!</strong>
          </p>
          <p className={`${inter.className} text-xl text-gray-800 md:text-2xl md:leading-normal`}>
            The Buttoms-Up Budget App</p>
          <div className="flex flex-col lg:flex-row gap-4">
          <Link
            href="/login"
            className="flex w-40 items-center gap-5 self-start rounded-lg bg-blue-500 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-400 md:text-base"
          >
            <span>Log in</span> <ArrowRightIcon className="w-5 md:w-6" />
          </Link>
          <Link
            href="/signup"
            className="flex w-40 items-center gap-5 self-start rounded-lg bg-green-500 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-green-700 md:text-base"
          >
            <span>Sign Up</span> <ArrowRightIcon className="w-5 md:w-6" />
          </Link>
          </div>
          
        </div>
        <div className="flex flex-col items-center justify-center p-6 md:w-3/5 md:px-28 md:py-12">
          {/* Add Hero Images Here */}
          <Image
          src="/pluto-desktop.png"
          width={1000}
          height={760}
          className='hidden md:block'
          alt="Screenshots of the dashboard project showing desktop version"
          />
          <Image
          src="/pluto-desktop.png"
          width={560}
          height={620}
          className='block md:hidden'
          alt="Screenshots of the dashboard project showing desktop version"
          />
        </div>
      </div>
    </main>
    
  );
}
