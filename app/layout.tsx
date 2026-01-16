import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Sidebar from './components/Sidebar'
import SessionProvider from './components/SessionProvider'
import { getServerSession } from "next-auth";
import Login from './components/Login'
import ClientProvider from './components/ClientProvider'
import { authOption } from '../pages/api/auth/[...nextauth]'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Conexus - IA Connie para EHS',
  description: 'Plataforma de inteligencia artificial especializada en Seguridad Industrial, Salud Ocupacional y Medio Ambiente. Connie, tu asistente virtual EHS.',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOption);

  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen`}>
        <SessionProvider session={session}>
          {
            !session ? (<Login/>) :
            (
              <div className='flex h-screen overflow-hidden'>
                <Sidebar/>
                <ClientProvider/>
                <main className='flex-1 flex flex-col overflow-hidden'>
                  {children}
                </main>
              </div>
            )
          }
        </SessionProvider>
      </body>
    </html>
  )
}
