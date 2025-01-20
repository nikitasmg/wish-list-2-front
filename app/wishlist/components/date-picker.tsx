import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { FormControl, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { CalendarIcon } from 'lucide-react'
import * as React from 'react'

type Props = {
  value?: Date
  onChange: (value: Date | undefined) => void
};

export const DatePicker = ({ value, onChange }: Props) => {
  return (
    <FormItem className="flex flex-col">
      <FormLabel>Дата проведения мероприятия</FormLabel>
      <Popover>
        <PopoverTrigger asChild>
          <FormControl>
            <Button
              variant={'outline'}
              className={cn(
                'w-full pl-3 text-left font-normal',
                !value && 'text-muted-foreground',
              )}
            >
              {value ? (
                format(value, 'PPP', {
                  locale: ru,
                })
              ) : (
                <span>Выбери дату</span>
              )}
              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
            </Button>
          </FormControl>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            locale={ru}
            selected={value ?? undefined}
            onSelect={onChange}
            disabled={(date) =>
              date < new Date()
            }
            initialFocus
          />
        </PopoverContent>
      </Popover>
      <FormMessage />
    </FormItem>
  )
}