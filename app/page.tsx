import { Header } from '@/components/Header'
import Image from 'next/image'
import React from 'react'

export default function Home() {
  return (
    <>
      <Header />
      <main className="max-w-screen-2xl mx-auto flex flex-col">
        <h2 className="text-3xl max-w-[570px] mb-10 md:text-5xl md:mb-16">
          Добро пожаловать в мир <span className="text-primary">вишлистов</span>
        </h2>
        <div className="flex flex-col gap-4 items-center justify-between mb-10 md:flex-row">
          <div className="bg-primary p-5 rounded-2xl text-xl flex items-center gap-2 cursor-pointer text-gray-100 w-full justify-center md:w-auto md:justify-start">
            <div
              className="flex justify-center items-center text-3xl text-primary p-3 rounded-full bg-gray-300 w-[30px] h-[30px]">+
            </div>
            Хочу вишлист
          </div>
          <div className="text-3xl max-w-[700px]">
            <span className="text-primary font-bold">Get wishlist</span> - это бесплатный сервис по созданию вишлистов
          </div>
        </div>
        <div className="flex flex-col items-start justify-between mb-10 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl md:text-4xl mb-5">Как это работает?</h2>
            <div className="flex flex-col items-start gap-5 md:flex-row md:gap-10">
              <div className="md:max-w-[180px] text-2xl md:text-xl flex md:flex-col gap-2 md:gap-4">
                <div
                  className="flex items-center flex-shrink-0 justify-center w-[40px] h-[40px] bg-primary text-gray-200 rounded-full font-bold">
                  1
                </div>
                <div>
                  Создай список: добавляй свои хотелки с фотографиями и описаниями
                </div>
              </div>
              <div className="md:max-w-[180px] flex md:flex-col gap-4 text-2xl md:text-xl">
                <div
                  className="flex items-center flex-shrink-0  justify-center w-[40px] h-[40px] bg-primary text-gray-200 rounded-full font-bold">
                  2
                </div>
                <div>
                  Поделись ссылкой в соцсетях или мессенджерах
                </div>
              </div>
              <div className="md:max-w-[180px] flex md:flex-col gap-4 text-2xl md:text-xl">
                <div
                  className="flex items-center flex-shrink-0  justify-center w-[40px] h-[40px] bg-primary text-gray-200 rounded-full font-bold">
                  3
                </div>
                <div>
                  Получай подарки: друзья смогут выбрать и купить их прямо из твоего списка
                </div>
              </div>
            </div>
          </div>
          <Image className='m-auto' src="/present-2.png" alt="present" width={400} height={150} />
        </div>
        <div className="flex flex-col-reverse justify-between mb-10 md:flex-row mditems-center">
          <Image className='m-auto' src="/people.png" alt="present" width={400} height={150} />
          <div>
            <h2 className="text-4xl mb-4">Почему это круто?</h2>
            <div className="flex flex-col items-start gap-4 md:flex-row md:items-start md:gap-16">
              <div className="md:max-w-[220px]">
                <span className="text-3xl text-primary">Удобство - </span> <br />
                все желания <br /> в одном клике!
              </div>
              <div className="md:max-w-[220px]">
                <span className="text-3xl text-primary">Точность - </span> <br />
                никаких больше <br /> ненужных подарков!
              </div>
              <div className="md:max-w-[220px]">
                <span className="text-3xl text-primary">Организация - </span> <br />
                планируй покупки и события легко!
              </div>
            </div>
          </div>
        </div>
        <div className="text-2xl mx-auto mb-10">
          Присоединяйся и преврати свои мечты в реальность с легкостью и радостью!
          <br />
          <span className="text-primary">
            Пусть твои друзья сделают выбор за тебя
          </span>
        </div>
        <button className="bg-primary text-gray-200 text-xl max-w-[300px] p-4 rounded-xl mx-auto">
          Вперед за вишлистом!
        </button>
      </main>
    </>
  )
}
