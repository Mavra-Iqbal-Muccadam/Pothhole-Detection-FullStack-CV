// src/components/UploadSection.js
import React, { useState, useRef } from 'react';
import { useCamera } from '../hooks/useCamera';

const UploadSection = () => {
  const [activeUploadType, setActiveUploadType] = useState(null);
  const [uploadedVideo, setUploadedVideo] = useState(null);
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const [isRecording, setIsRecording] = useState(false);

  const {
    stream,
    isCameraActive,
    videoRef,
    canvasRef,
    startCamera,
    stopCamera,
    captureImage
  } = useCamera();

  const uploadTypes = [
    {
      id: 'drag-drop',
      icon: 'fas fa-cloud-upload-alt',
      title: 'Upload Evidence Files',
      description: 'Attach photos or videos of damaged roads for official review.'
    },
    {
      id: 'camera-capture',
      icon: 'fas fa-camera',
      title: 'Capture from Field Camera',
      description: 'Field staff can capture live images during inspections.'
    },
    {
      id: 'video-upload',
      icon: 'fas fa-video',
      title: 'Submit Inspection Videos',
      description: 'Upload corridor drive-by footage for automated analysis.'
    }
  ];

  const handleUploadTypeClick = (type) => {
    setActiveUploadType(type);
    if (type === 'camera-capture') {
      startCamera();
    } else if (type !== 'camera-capture' && isCameraActive) {
      stopCamera();
    }
  };

  const handleFileInput = (event) => {
    const files = event.target.files;
    if (files.length > 0) {
      console.log('Uploading files:', Array.from(files).map(f => f.name));
      // Handle file upload logic here
    }
  };

  const handleVideoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setUploadedVideo(url);
    }
  };

  const startRecordingVideo = () => {
    if (!stream) {
      alert('Camera stream not available. Please start the camera first.');
      return;
    }

    try {
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      recordedChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setUploadedVideo(url);
        setIsRecording(false);
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
    } catch (err) {
      console.error('Error starting video recording:', err);
      alert('Unable to start video recording in this browser.');
    }
  };

  const stopRecordingVideo = () => {
    const recorder = mediaRecorderRef.current;
    if (recorder && isRecording) {
      recorder.stop();
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.currentTarget.style.borderColor = '#2196f3';
    event.currentTarget.style.backgroundColor = 'rgba(33, 150, 243, 0.1)';
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    event.currentTarget.style.borderColor = '#64b5f6';
    event.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
  };

  const handleDrop = (event) => {
    event.preventDefault();
    handleDragLeave(event);
    const files = event.dataTransfer.files;
    handleFileInput({ target: { files } });
  };

  return (
    <section className="upload-section" id="upload">
      <h2>Submit Road Condition Reports</h2>
      <p>
        Use the options below to share road surface conditions with the responsible department.
        Uploaded evidence supports faster maintenance decisions.
      </p>
      
      <div className="upload-options">
        {uploadTypes.map(type => (
          <div
            key={type.id}
            className="upload-box"
            onClick={() => handleUploadTypeClick(type.id)}
          >
            <i className={type.icon}></i>
            <h3>{type.title}</h3>
            <p>{type.description}</p>
          </div>
        ))}
      </div>
      
      {/* Drag & Drop Area */}
      {activeUploadType === 'drag-drop' && (
        <div
          className="upload-area"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <i className="fas fa-cloud-upload-alt"></i>
          <p>Drag and drop inspection files here</p>
          <p className="small">Supported formats: JPG, PNG, MP4, MOV, AVI</p>
          <input
            type="file"
            ref={fileInputRef}
            multiple
            style={{ display: 'none' }}
            onChange={handleFileInput}
          />
        </div>
      )}
      
      {/* Camera Capture */}
      {activeUploadType === 'camera-capture' && isCameraActive && (
        <>
          <div className="camera-preview">
            <video ref={videoRef} autoPlay></video>
            <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
          </div>
          <div className="camera-controls">
            <button className="capture-btn" onClick={captureImage}>
              Capture Image
            </button>
            <button
              className="capture-btn"
              style={{ background: isRecording ? '#999' : '#2ecc71' }}
              onClick={isRecording ? stopRecordingVideo : startRecordingVideo}
            >
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </button>
            <button className="capture-btn" style={{ background: '#666' }} onClick={startCamera}>
              Retake
            </button>
            <button className="capture-btn" style={{ background: '#e74c3c' }} onClick={stopCamera}>
              Close Camera
            </button>
          </div>
        </>
      )}
      
      {/* Video Upload */}
      {activeUploadType === 'video-upload' && (
        <div className="video-upload-container">
          <div
            className="upload-area"
            onClick={() => videoInputRef.current?.click()}
          >
            <i className="fas fa-video"></i>
            <p>Drag and drop your inspection video here or click to browse</p>
            <p className="small">Supported formats: MP4, MOV, AVI</p>
            <input
              type="file"
              ref={videoInputRef}
              accept="video/*"
              style={{ display: 'none' }}
              onChange={handleVideoUpload}
            />
          </div>
          
          {uploadedVideo && (
            <>
              <div className="video-preview">
                <video src={uploadedVideo} controls>
                  Your browser does not support the video tag.
                </video>
              </div>
              <div className="video-controls">
                <button className="btn" onClick={() => alert('Video submitted for government analysis.')}>
                  Submit for Analysis
                </button>
                <button
                  className="btn"
                  style={{ background: '#666' }}
                  onClick={() => {
                    setUploadedVideo(null);
                    videoInputRef.current.value = '';
                  }}
                >
                  Change Video
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
};

export default UploadSection;