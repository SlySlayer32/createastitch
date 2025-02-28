'use client';

    import React, { useState, useRef, useEffect } from 'react';
    import { Button } from '@/components/ui/button';
    import { Label } from '@/components/ui/label';
    import { Input } from '@/components/ui/input';
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import { Badge } from './ui/badge';
    import { ReloadIcon } from '@radix-ui/react-icons';

    interface Color {
      r: number;
      g: number;
      b: number;
      hex: string;
    }

    export const PatternGenerator = () => {
      const [image, setImage] = useState<File | null>(null);
      const [aidaCount, setAidaCount] = useState('14');
      const [gridWidth, setGridWidth] = useState('80');
      const [gridHeight, setGridHeight] = useState('80');
      const [palette, setPalette] = useState('DMC');
      const [algorithm, setAlgorithm] = useState('simple');
      const [pattern, setPattern] = useState<Color[][]>([]);
      const [processing, setProcessing] = useState(false);
      const [error, setError] = useState<string | null>(null);

      const canvasRef = useRef<HTMLCanvasElement>(null);

      const MAX_WIDTH = 3000;
      const MAX_HEIGHT = 3000;
      const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/bmp'];
      const MAX_COLORS = 50; // Maximum number of dominant colors

      // DMC color palette (expanded subset)
      const dmcColors: Color[] = [
        { r: 255, g: 255, b: 255, hex: '#FFFFFF' }, // White
        { r: 0, g: 0, b: 0, hex: '#000000' },     // Black
        { r: 208, g: 18, b: 45, hex: '#D0122D' },  // Red
        { r: 34, g: 139, b: 34, hex: '#228B22' }, // Green
        { r: 0, g: 0, b: 255, hex: '#0000FF' },    // Blue
        { r: 255, g: 255, b: 0, hex: '#FFFF00' },  // Yellow
        { r: 139, g: 69, b: 19, hex: '#8B4513' },  // Brown
        { r: 255, g: 182, b: 193, hex: '#FFB6C1' }, // Light Pink
        { r: 70, g: 130, b: 180, hex: '#4682B4' }, // Steel Blue
        { r: 128, g: 128, b: 128, hex: '#808080' }, // Gray
        { r: 245, g: 245, b: 220, hex: '#F5F5DC' }, // Beige
        { r: 218, g: 165, b: 32, hex: '#DAA520' },  // Goldenrod
        { r: 0, g: 128, b: 128, hex: '#008080' },    // Teal
        { r: 255, g: 192, b: 203, hex: '#FFC0CB' }, // Pink
        { r: 160, g: 82, b: 45, hex: '#A0522D' },   // Sienna
        { r: 0, g: 255, b: 0, hex: '#00FF00' },     // Lime
        { r: 255, g: 165, b: 0, hex: '#FFA500' },   // Orange
        { r: 75, g: 0, b: 130, hex: '#4B0082' },   // Indigo
        { r: 238, g: 130, b: 238, hex: '#EE82EE' }, // Violet
        { r: 165, g: 42, b: 42, hex: '#A52A2A' },   // Brown (different shade)
      ];

      const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];

          if (!ALLOWED_TYPES.includes(file.type)) {
            setError('Invalid file type. Please upload a JPG, PNG, or BMP image.');
            return;
          }

          setImage(file);
          setError(null);

          const reader = new FileReader();
          reader.onload = (e: ProgressEvent<FileReader>) => {
            if (e.target && e.target.result) {
              const img = new Image();
              img.onload = () => {
                let width = img.width;
                let height = img.height;
                let scale = 1;

                if (width > MAX_WIDTH) {
                  scale = MAX_WIDTH / width;
                  width = MAX_WIDTH;
                  height *= scale;
                }

                if (height > MAX_HEIGHT) {
                  scale = MAX_HEIGHT / height;
                  height = MAX_HEIGHT;
                  width *= scale;
                }

                if (scale !== 1) {
                  const canvas = document.createElement('canvas');
                  canvas.width = width;
                  canvas.height = height;
                  const ctx = canvas.getContext('2d');
                  if (ctx) {
                    ctx.drawImage(img, 0, 0, width, height);
                    //setImageUrl(canvas.toDataURL()); // No longer needed
                  } else {
                    setError("Could not resize image: Canvas context error.");
                  }
                } else {
                  //setImageUrl(img.src); // No longer needed
                }
              };
              img.onerror = () => {
                setError("Error loading image.");
              };
              img.src = e.target.result as string;
            }
          };
          reader.onerror = () => {
            setError("Error reading file.");
          };
          reader.readAsDataURL(file);
        }
      };

      // Find the closest DMC color
      const findClosestColor = (r: number, g: number, b: number, paletteColors: Color[]): Color => {
        let closestColor: Color = paletteColors[0];
        let minDistance = Infinity;

        for (const color of paletteColors) {
          const distance = Math.sqrt(
            Math.pow(r - color.r, 2) +
            Math.pow(g - color.g, 2) +
            Math.pow(b - color.b, 2)
          );
          if (distance < minDistance) {
            minDistance = distance;
            closestColor = color;
          }
        }
        return closestColor;
      };

      // Simplified K-means clustering
      const kmeans = (pixels: number[][], k: number, maxIterations = 10): Color[] => {
          if (pixels.length <= k) {
            return pixels.map(p => ({ r: p[0], g: p[1], b: p[2], hex: rgbToHex(p[0],p[1],p[2]) }));
          }

        // 1. Initialize centroids randomly
        const centroids: Color[] = [];
        for (let i = 0; i < k; i++) {
          const randomPixel = pixels[Math.floor(Math.random() * pixels.length)];
          centroids.push({ r: randomPixel[0], g: randomPixel[1], b: randomPixel[2], hex: rgbToHex(randomPixel[0],randomPixel[1],randomPixel[2]) });
        }

        for (let iteration = 0; iteration < maxIterations; iteration++) {
          // 2. Assign pixels to the nearest centroid
          const clusters: number[][][] = Array.from({ length: k }, () => []);
          for (const pixel of pixels) {
            const closestCentroidIndex = findClosestColor(pixel[0], pixel[1], pixel[2], centroids).hex;
            const index = centroids.findIndex(c => c.hex === closestCentroidIndex)
            clusters[index].push(pixel);
          }

          // 3. Recalculate centroids
          for (let i = 0; i < k; i++) {
            if (clusters[i].length > 0) {
              const sumR = clusters[i].reduce((sum, pixel) => sum + pixel[0], 0);
              const sumG = clusters[i].reduce((sum, pixel) => sum + pixel[1], 0);
              const sumB = clusters[i].reduce((sum, pixel) => sum + pixel[2], 0);
              const avgR = Math.round(sumR / clusters[i].length);
              const avgG = Math.round(sumG / clusters[i].length);
              const avgB = Math.round(sumB / clusters[i].length);
              centroids[i] = { r: avgR, g: avgG, b: avgB, hex: rgbToHex(avgR, avgG, avgB) };
            }
          }
        }

        return centroids;
      };

        const rgbToHex = (r: number, g: number, b: number): string => {
            const componentToHex = (c: number) => {
                const hex = c.toString(16);
                return hex.length == 1 ? "0" + hex : hex;
            };
            return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
        };

      const generatePattern = async () => {
        console.log('generatePattern: Start'); // Log start of function
        if (!image) {
          setError("Please upload an image.");
          console.log('generatePattern: No image uploaded'); // Log if no image
          setProcessing(false); // Ensure processing is set to false
          return;
        }

        setProcessing(true);
        setError(null);

        try {
          const img = new Image();
          img.src = URL.createObjectURL(image);
          await img.decode();
          console.log('generatePattern: Image decoded'); // Log after image decode

          const canvas = canvasRef.current;
          if (!canvas) {
            console.log('generatePattern: Canvas ref not found'); // Log if canvas ref is missing
            setProcessing(false);
            return;
          }
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            console.log('generatePattern: Canvas context error'); // Log if context is missing
            setProcessing(false);
            return;
          }
          console.log('generatePattern: Canvas context obtained'); // Log if context obtained

          const width = parseInt(gridWidth);
          const height = parseInt(gridHeight);

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          console.log('generatePattern: Image drawn on canvas'); // Log after drawing image

          const imageData = ctx.getImageData(0, 0, width, height).data;
          console.log('generatePattern: Image data extracted'); // Log after getting image data

          // ** Color Reduction (K-means) **
          const pixelData: number[][] = [];
          for (let i = 0; i < imageData.length; i += 4) {
            pixelData.push([imageData[i], imageData[i + 1], imageData[i + 2]]);
          }
          console.log('generatePattern: Pixel data prepared'); // Log after pixel data prep
          const dominantColors = kmeans(pixelData, MAX_COLORS);
          console.log('generatePattern: Dominant colors calculated', dominantColors); // Log dominant colors

          // ** Pattern Generation with Reduced Palette **
          const newPattern: Color[][] = [];
          for (let y = 0; y < height; y++) {
            const row: Color[] = [];
            for (let x = 0; x < width; x++) {
              const index = (y * width + x) * 4;
              const r = imageData[index];
              const g = imageData[index + 1];
              const b = imageData[index + 2];
              // Use the dominant colors from K-means as the palette
              const closestColor = findClosestColor(r, g, b, dominantColors);
              row.push(closestColor);
            }
            newPattern.push(row);
          }
          console.log('generatePattern: New pattern generated', newPattern); // Log new pattern
          setPattern(newPattern);
          console.log('generatePattern: Pattern state updated', newPattern); // Log pattern state update

        } catch (err:any) {
          setError(`Error generating pattern: ${err.message}`);
          console.error('generatePattern: Error during pattern generation', err); // Log any errors
        } finally {
          setProcessing(false);
          console.log('generatePattern: Finally block - Processing set to false'); // Log finally block
        }
        console.log('generatePattern: End'); // Log end of function
      };

        useEffect(() => {
        // Remove imageUrl from dependencies.  We only regenerate when grid size, etc., change.
        if (image) {
            generatePattern()
        }
    }, [image, aidaCount, gridWidth, gridHeight, palette, algorithm]);


      return (
        <div className="flex h-screen w-full">
          {/* Left Sidebar */}
          <aside className="w-72 p-6 border-r border-border flex flex-col space-y-6 bg-secondary">
            <h1 className="text-xl font-bold text-current">Pattern Generator</h1>

            <div className="space-y-4">
              <div className="input-group">
                <Label htmlFor="imageUpload" className="input-label">Upload Image</Label>
                <Input type="file" id="imageUpload" accept="image/*" onChange={handleImageUpload} className="input-field" />
              </div>

              <div className="input-group">
                <Label htmlFor="aidaCount" className="input-label">Aida Count</Label>
                <Select value={aidaCount} onValueChange={setAidaCount}>
                  <SelectTrigger className="select-trigger">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent className='select-content'>
                    <SelectItem value="14">14 Count</SelectItem>
                    <SelectItem value="16">16 Count</SelectItem>
                    <SelectItem value="18">18 Count</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="input-group">
                <Label htmlFor="gridWidth" className="input-label">Grid Width (Stitches)</Label>
                <Input type="number" id="gridWidth" value={gridWidth} onChange={(e) => setGridWidth(e.target.value)} className="input-field" />
              </div>

              <div className="input-group">
                <Label htmlFor="gridHeight" className="input-label">Grid Height (Stitches)</Label>
                <Input type="number" id="gridHeight" value={gridHeight} onChange={(e) => setGridHeight(e.target.value)} className="input-field" />
              </div>

              <div className="input-group">
                <Label htmlFor="palette" className="input-label">Color Palette</Label>
                <Select value={palette} onValueChange={setPalette}>
                  <SelectTrigger className="select-trigger">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent className='select-content'>
                    <SelectItem value="DMC">DMC</SelectItem>
                    <SelectItem value="Anchor">Anchor</SelectItem>
                    <SelectItem value="Custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="input-group">
                <Label htmlFor="algorithm" className="input-label">Algorithm</Label>
                <Select value={algorithm} onValueChange={setAlgorithm}>
                  <SelectTrigger className="select-trigger">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent className='select-content'>
                    <SelectItem value="simple">Simple</SelectItem>
                    <SelectItem value="dithering">Dithering</SelectItem>
                    <SelectItem value="pattern-aware">Pattern-Aware</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button variant="primary" onClick={generatePattern} disabled={processing} className="btn-primary w-full">
              {processing ? (
                <>
                  <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Pattern'
              )}
            </Button>

            {error && <p className="text-red mt-2">{error}</p>}
          </aside>

          {/* Main Area */}
          <main className="flex-1 p-6">
            <div className="border border-border p-4 rounded-lg">
                <h2 className="text-lg font-semibold mb-4 text-current">Pattern Preview</h2>
                {/* Aida Grid Display */}
                <div className="aida-grid-container" >
                    {pattern.length === 0 ? (
                        // Render empty grid cells when no pattern is generated
                        Array.from({ length: parseInt(gridHeight) }).map((_, y) =>
                            Array.from({ length: parseInt(gridWidth) }).map((_, x) => (
                                <div
                                    key={`${x}-${y}`}
                                    className={`aida-stitch ${
                                        x % 10 === 0 ? 'aida-block-start-x' : ''
                                    } ${y % 10 === 0 ? 'aida-block-start-y' : ''}`}
                                ></div>
                            ))
                        )
                    ) : (
                        // Render pattern when available
                        pattern.flatMap((row, y) =>
                            row.map((color, x) => (
                                <div
                                    key={`${x}-${y}`}
                                    className={`aida-stitch ${
                                        x % 10 === 0 ? 'aida-block-start-x' : ''
                                    } ${y % 10 === 0 ? 'aida-block-start-y' : ''}`}
                                    style={{
                                        backgroundColor: color.hex,
                                    }}
                                ></div>
                            ))
                        )
                    )}
                </div>
                {/* Color Legend */}
                <div className="mt-6">
                  <h3 className="text-md font-semibold text-current">Color Legend</h3>
                  <div className="flex flex-wrap mt-2">
                    {pattern.length > 0 && Array.from(new Set(pattern.flat().map(c => c.hex))).map((hexColor) => {
                      const color = pattern.flat().find(c => c.hex === hexColor);
                      if (!color) return null;
                      return (
                        <Badge key={hexColor} style={{ backgroundColor: hexColor, color: ['#FFFFFF', '#000000'].includes(hexColor) ? (color.r * 0.299 + color.g * 0.587 + color.b * 0.114) > 186 ? 'black': 'white' : 'white', marginLeft:'2px' }}>
                          {hexColor}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              </div>
          </main>
        </div>
      );
    };
