"use client"
import { useRef, useEffect, useState } from 'react'
import Tesseract from 'tesseract.js'

const Home = () => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [price, setPrice] = useState<string>('')
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
        const priceNumber = Number(priceMatch.toString().split(' ')[1].replace(',', '.'))
        setPrice(priceMatch[0])
        setTotalPrice((prev) => prev + priceNumber)
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
      <div className={`relative flex flex-col items-center ${price && price !== 'error' && 'border-emerald-400'} ${price === 'error' && 'border-rose-600'} border-2`}>
        <video ref={videoRef} autoPlay playsInline className='w-full'></video>
        <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
        <span className={`absolute z-10 bottom-4 ${price && price !== 'error' && 'text-emerald-400'}`}>{price && price !== 'error' ? price : dataDetected}</span>
      </div>
      <button className='p-2 bg-indigo-600' onClick={captureImage}>Detectar</button>
      <p>Preço Detectado: {price !== 'error' ? price : ''}</p>
      <div className='flex gap-2 items-center'>
        <span className='font-bold text-lg'>Valor total:</span>
        <span>R$ {totalPrice.toFixed(2).toString().replace('.', ',')}</span>
      </div>
    </div>
  )
}

export default Home