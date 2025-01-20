import { FormControl, FormItem, FormLabel } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { colorSchema } from '@/shared/constants'
import * as React from 'react'

type Props = {
  value: string
  onChange: (value: string) => void
};
export const ColorsSelect = ({value, onChange}: Props) => {
  return (
    <FormItem>
      <FormLabel>Цветовая схема</FormLabel>
      <FormControl>
        <Select onValueChange={onChange} defaultValue={value}>
          <SelectTrigger className="">
            <SelectValue placeholder="Выберите цветовую схему" />
          </SelectTrigger>
          <SelectContent>
            {colorSchema.map(({ value, name, colors }) => (
              <SelectItem key={value} value={value}>
                <div className="flex items-center justify-between gap-4">
                  <span>{name}</span>
                  <div className="flex items-center gap-2">
                    {colors.map((color) => (
                      <div key={color} className={`w-[20px] h-[20px]`} style={{ backgroundColor: color }} />
                    ))}
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormControl>
    </FormItem>
  )
}