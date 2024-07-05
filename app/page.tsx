"use client"
import { useRef, useEffect, useState } from 'react';
import Tesseract from 'tesseract.js';

const Home = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [price, setPrice] = useState<string>('');
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [dataDetected, setDataDetected] = useState<string>('');

  useEffect(() => {
    const getCameraStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("Erro ao acessar a câmera: ", error);
      }
    };

    getCameraStream();
  }, []);

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context?.drawImage(videoRef.current, 0, 0);
      const imageData = canvasRef.current.toDataURL('image/png');

      Tesseract.recognize(
        imageData,
        'por',
        {
          logger: m => console.log(m),
        }
      ).then(({ data: { text } }) => {
        const priceMatch = text.match(/R\$ ?\d+(\.\d{3})*,\d{2}/g);
        setDataDetected(text);
        if (priceMatch) {
          const priceNumber = Number(priceMatch.toString().split(' ')[1].replace(',', '.'))
          setPrice(`${priceMatch[0]} - ${priceNumber}`);
          setTotalPrice((prev) => prev + priceNumber)
        } else {
          setPrice('Preço não detectado');
        }
      });
    }
  };

  return (
    <div>
      <h1>Capturar Preço</h1>
      <h2>R$ {totalPrice.toFixed(2).toString().replace('.', ',')}</h2>
      <button onClick={captureImage}>Capturar e Detectar Preço</button>
      <p>Texto Detectado: {dataDetected}</p>
      <p>Preço Detectado: {price}</p>
      <video ref={videoRef} autoPlay style={{ width: '30%' }}></video>
      <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
    </div>
  );
};

export default Home;