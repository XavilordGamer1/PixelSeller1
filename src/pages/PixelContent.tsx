import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePixelContext } from '../context/PixelContext';
import { Upload, Check, X } from 'lucide-react';
import { updatePixelContent } from '../services/pixelService';
import { PixelData } from '../services/db';
import { supabase } from '../services/supabaseClient';

const PixelContent = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const { selectedPixels, paymentCompleted, resetState } = usePixelContext();
  const navigate = useNavigate();
  const pricePerPixel = 1;

  const totalSelected = selectedPixels.length;
  const totalCost = totalSelected * pricePerPixel;

  useEffect(() => {
    if (!paymentCompleted) {
      navigate('/selection');
    }
  }, [paymentCompleted, navigate]);

  useEffect(() => {
    if (isComplete) {
      const timer = setTimeout(() => {
        resetState();
        navigate('/');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isComplete, navigate, resetState]);

  // Cuando el usuario selecciona un archivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
    if (file) {
      // Mostrar preview local para confirmación
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImageUrl('');
    }
  };

  // Sube el archivo a Supabase Storage y retorna la URL pública
  const uploadFileToStorage = async (file: File, pixelId: number): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `pixel_${pixelId}.${fileExt}`;
    const filePath = fileName;

    setIsUploading(true);
    setUploadProgress(0);

    const interval = setInterval(() => {
      setUploadProgress((prev) => Math.min(prev + 10, 90));
    }, 100);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('pixel-images')
      .upload(filePath, file, { upsert: true });

    clearInterval(interval);
    setUploadProgress(100);
    setIsUploading(false);

    if (uploadError) {
      console.error('Error subiendo archivo:', uploadError);
      return null;
    }

    const { data } = supabase.storage
      .from('pixel-images')
      .getPublicUrl(filePath);

    if (!data || !data.publicUrl) {
      console.error('Error obteniendo URL pública');
      return null;
    }

    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return alert('Por favor selecciona una imagen');

    setIsSubmitting(true);

    try {
      // Para bloque o píxel individual, identificamos origen y dimensiones
      const xs = selectedPixels.map((cell: any) => cell.x);
      const ys = selectedPixels.map((cell: any) => cell.y);
      const minX = Math.min(...xs);
      const minY = Math.min(...ys);
      const maxX = Math.max(...xs);
      const maxY = Math.max(...ys);
      const blockOrigin = { x: minX, y: minY };
      const blockSize = { width: maxX - minX + 1, height: maxY - minY + 1 };

      // Encontrar píxel origen para subir imagen
      const originPixel = selectedPixels.find((p: any) => p.x === minX && p.y === minY);
      if (!originPixel) throw new Error('No se encontró el píxel origen');

      // Subir archivo y obtener URL pública
      const uploadedUrl = await uploadFileToStorage(selectedFile, originPixel.id);
      if (!uploadedUrl) throw new Error('Error al subir imagen');

      let updatedPixels: PixelData[] = [];

      if (selectedPixels.length > 1) {
        updatedPixels = selectedPixels.map((cell: any) => {
          if (cell.x === minX && cell.y === minY) {
            return {
              id: cell.id,
              status: 'sold',
              imageUrl: uploadedUrl,
              x: cell.x,
              y: cell.y,
              owner: 'demoUser',
              blockOrigin,
              blockSize,
            };
          } else {
            return {
              id: cell.id,
              status: 'sold',
              imageUrl: "", // evitar duplicar imagen en otras celdas
              x: cell.x,
              y: cell.y,
              owner: 'demoUser',
            };
          }
        });
      } else {
        updatedPixels = selectedPixels.map((cell: any) => ({
          id: cell.id,
          status: 'sold',
          imageUrl: uploadedUrl,
          x: cell.x,
          y: cell.y,
          owner: 'demoUser',
        }));
      }

      await updatePixelContent(updatedPixels);
      setIsComplete(true);
    } catch (error) {
      console.error('Error al actualizar contenido del píxel:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearImage = () => {
    setSelectedFile(null);
    setImageUrl('');
    setUploadProgress(0);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {isComplete ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Content Uploaded Successfully!
          </h1>
          <p className="text-gray-600 mb-6">
            Your image has been applied to your {totalSelected} purchased pixels, totaling ${totalCost}.00.
          </p>
          <p className="text-gray-500 text-sm">Redirecting to Gallery...</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-blue-600 p-6 text-white">
            <h1 className="text-2xl font-bold">Customize Your Pixels</h1>
            <p className="mt-2 opacity-90">Upload an image to display on your purchased pixels.</p>
          </div>
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Your Purchase</h2>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-gray-700">
                  You've purchased <span className="font-bold">{totalSelected}</span> pixels.
                </p>
                <p className="text-gray-700 mt-1">
                  Total: <span className="font-bold">${totalCost}.00</span>
                </p>
              </div>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Upload Image</h2>
                {imageUrl ? (
                  <div className="mb-4 relative">
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="w-full h-auto rounded-lg border border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={clearImage}
                      className="absolute top-2 right-2 bg-white p-1 rounded-full shadow-md hover:bg-gray-100"
                    >
                      <X className="h-5 w-5 text-gray-700" />
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-4">
                    <div className="flex justify-center items-center">
                      <Upload className="h-12 w-12 text-gray-400 mr-3" />
                      <span className="text-gray-600">Click to select an image</span>
                    </div>
                    <input
                      type="file"
                      id="image-upload"
                      accept="image/png"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="image-upload"
                      className="cursor-pointer mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Select Image
                    </label>
                  </div>
                )}
                {isUploading && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
              <button
                type="submit"
                disabled={!imageUrl || isSubmitting || isUploading}
                className={`w-full py-3 px-4 rounded-lg flex items-center justify-center font-medium ${
                  !imageUrl || isSubmitting || isUploading
                    ? 'bg-gray-400 text-gray-100 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 transition-colors'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Check className="h-5 w-5 mr-2" />
                    Apply Image to Pixels
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PixelContent;
