'use client'

import * as React from 'react'

/**
 * Плотность полей ввода. По умолчанию поле крупное (48px) — формы и
 * телефон. Боковые панели конструктора оборачиваются в «md» (40px, как
 * в макете инспектора): одна обёртка вместо пропса на каждом поле.
 */
export type Density = 'md' | 'lg'

const DensityContext = React.createContext<Density>('lg')

export function InputDensity({ value, children }: { value: Density; children: React.ReactNode }) {
  return <DensityContext.Provider value={value}>{children}</DensityContext.Provider>
}

export function useInputDensity(): Density {
  return React.useContext(DensityContext)
}
