import React, { createContext, useContext, useState } from 'react'
import type { Subject } from './types'

interface SubjectContextType {
  subject: Subject
  setSubject: (s: Subject) => void
}

const SubjectContext = createContext<SubjectContextType>({
  subject: 'math',
  setSubject: () => {}
})

export function SubjectProvider({ children }: { children: React.ReactNode }) {
  const [subject, setSubject] = useState<Subject>('math')
  return (
    <SubjectContext.Provider value={{ subject, setSubject }}>
      {children}
    </SubjectContext.Provider>
  )
}

export function useSubject() {
  return useContext(SubjectContext)
}
