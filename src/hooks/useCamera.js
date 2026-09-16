// src/hooks/useCamera.js
import { useState, useRef, useCallback } from 'react';

export const useCamera = () => {
  const [stream, setStream] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsCameraActive(true);
    } catch (err) {
      console.error("Error accessing camera: ", err);
      alert("Unable to access camera. Please check permissions and try again.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
  }, [stream]);

  const captureImage = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
      
      // Here you would typically send the captured image to your server
      alert('Image captured! The AI is now analyzing the road condition.');
      stopCamera();
    }
  }, [stopCamera]);

  return {
    stream,
    isCameraActive,
    videoRef,
    canvasRef,
    startCamera,
    stopCamera,
    captureImage
  };
};