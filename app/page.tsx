"use client"
import { v4 as randomUUID } from 'uuid'
import { useRef, useEffect, useState } from 'react'
import Tesseract from 'tesseract.js'

const Home = () => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [price, setPrice] = useState<string>('')
  const [priceHistory, setPriceHistory] = useState<any[]>([])
  const [totalPrice, setTotalPrice] = useState<number>(0)
  const [dataDetected, setDataDetected] = useState<string>('')

  useEffect(() => {
    const getCameraStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        console.log("==>", {
          camera: stream,
        })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      } catch (error) {
        console.error("Erro ao acessar a câmera: ", error)
      }
    }

    getCameraStream()
  }, [])

  useEffect(() => {
    //calculate totalprice when priceHistory changes
    setTotalPrice(priceHistory.reduce((acc, item) => {
      const priceNumber = Number(item?.price?.split(' ')[1]?.replace(',', '.'))
      return acc + priceNumber
    }, 0))
  }, [priceHistory])

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d')
      canvasRef.current.width = videoRef.current.videoWidth
      canvasRef.current.height = videoRef.current.videoHeight
      context?.drawImage(videoRef.current, 0, 0)
      const imageData = canvasRef.current.toDataURL('image/png')

      Tesseract.recognize(
        imageData,
        'por',
        {
          logger: m => console.log(m),
        }
      ).then(({ data: { text } }) => {
        const priceMatch = text.match(/R\$ ?\d+(\.\d{3})*,\d{2}/g)
        setDataDetected(text)
        if (!priceMatch) {
          setPrice('error')
          return
        }
        const priceNumber = Number(priceMatch?.toString()?.split(' ')[1]?.replace(',', '.'))
        setPrice(priceMatch[0])
        setTotalPrice((prev) => prev + priceNumber)
        setPriceHistory((prev) => [...prev, { id: randomUUID(), price: priceMatch[0] }])
        setTimeout(() => {
          setPrice('')
          setDataDetected('')
        }, 3000)
      })
    }
  }

  return (
    <div className='flex flex-col w-full justify-center items-center gap-4 p-4'>
      <div className='flex gap-4 w-full justify-between'>

        <h1 className='font-black text-2xl'>POC Read Price</h1>
      </div>
      <div>

        <div className={`relative flex flex-col items-center ${price && price !== 'error' && 'border-emerald-400'} ${price === 'error' && 'border-rose-600'} border-2`}>
          <video ref={videoRef} autoPlay playsInline className='w-full' controls={false}></video>
          <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
          <span className={`absolute z-10 bottom-4 ${price && price !== 'error' && 'text-emerald-400'}`}>{price && price !== 'error' ? price : dataDetected}</span>
        </div>
        <button className='p-4 w-full bg-indigo-600' onClick={captureImage}>Detectar</button>
      </div>
      {price && price !== 'error' && <p className='text-emerald-400 font-bold'>Preço Detectado: {price}</p>}
      <div className='flex gap-2 items-center'>
        <span className='font-bold text-lg'>Valor total:</span>
        <span>R$ {totalPrice.toFixed(2).toString().replace('.', ',')}</span>
      </div>
      <div className='w-full'>
        <h2 className='font-bold text-lg'>Histórico de preços</h2>
        <ul className='flex flex-col gap-2'>
          {priceHistory.map((priceItem, index) => (
            <li key={priceItem.id} className='even:bg-zinc-800 odd:bg-zinc-600 rounded-md p-2'>
              <div className='flex justify-between items-center gap-2'>
                <span>{index + 1}. </span>
                <span className='w-full'>{priceItem.price}</span>
                <button className='bg-rose-600 p-2 w-12 rounded items-center justify-center' onClick={() => {
                  setPriceHistory((prev) => prev.filter((item) => item.id !== priceItem.id))
                }}>-</button>
              </div>

            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default Home