'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface InsulationLayer {
  thickness: number;
  thermalConductivity: number;
  thermalResistance: number;
}

interface FurnaceDimensions {
  length: number;
  width: number;
  height: number;
}

interface RodConfiguration {
  totalCount: number;
  hotEndLength: number;
  coldEndLength: number;
  lengthDirection: number;
  widthDirection: number;
  wallDistance: number;
  spacing: number;
  orientation: 'parallel' | 'perpendicular';
}

export default function FurnaceSimulator() {
  const [temperature, setTemperature] = useState(1000);
  const [heatingRate, setHeatingRate] = useState(5);
  const [simulationSpeed, setSimulationSpeed] = useState(1);
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentTemp, setCurrentTemp] = useState(25);
  
  const [insulationLayers, setInsulationLayers] = useState<InsulationLayer[]>([
    { thickness: 200, thermalConductivity: 0.5, thermalResistance: 400 },
    { thickness: 150, thermalConductivity: 0.4, thermalResistance: 375 },
    { thickness: 100, thermalConductivity: 0.3, thermalResistance: 333 },
    { thickness: 50, thermalConductivity: 0.2, thermalResistance: 250 },
  ]);
  
  const [furnaceDimensions, setFurnaceDimensions] = useState<FurnaceDimensions>({
    length: 2000,
    width: 1500,
    height: 1200,
  });
  
  const [rodConfig, setRodConfig] = useState<RodConfiguration>({
    totalCount: 12,
    hotEndLength: 400,
    coldEndLength: 200,
    lengthDirection: 4,
    widthDirection: 3,
    wallDistance: 100,
    spacing: 300,
    orientation: 'parallel',
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const drawHeatingRods = useCallback((
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    innerLength: number,
    innerWidth: number
  ) => {
    const wallDist = rodConfig.wallDistance * Math.min(innerLength / furnaceDimensions.length, innerWidth / furnaceDimensions.width);
    
    ctx.strokeStyle = '#FF4500';
    ctx.fillStyle = '#FF6347';
    ctx.lineWidth = 4;

    if (rodConfig.orientation === 'parallel') {
      const lengthSpacing = rodConfig.lengthDirection > 1 
        ? (innerLength - 2 * wallDist) / (rodConfig.lengthDirection - 1)
        : 0;
      const widthSpacing = rodConfig.widthDirection > 1
        ? (innerWidth - 2 * wallDist) / (rodConfig.widthDirection - 1)
        : 0;
      
      for (let i = 0; i < rodConfig.lengthDirection; i++) {
        for (let j = 0; j < rodConfig.widthDirection; j++) {
          const x = centerX - innerLength / 2 + wallDist + i * lengthSpacing;
          const y = centerY - innerWidth / 2 + wallDist + j * widthSpacing;
          
          if (!isFinite(x) || !isFinite(y)) continue;
          
          ctx.beginPath();
          ctx.arc(x, y, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          
          const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, 20);
          glowGradient.addColorStop(0, 'rgba(255, 69, 0, 0.8)');
          glowGradient.addColorStop(1, 'rgba(255, 69, 0, 0)');
          ctx.fillStyle = glowGradient;
          ctx.beginPath();
          ctx.arc(x, y, 20, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else {
      const spacing = rodConfig.lengthDirection > 1
        ? (innerLength - 2 * wallDist) / (rodConfig.lengthDirection - 1)
        : 0;
      
      for (let i = 0; i < rodConfig.lengthDirection; i++) {
        const x = centerX - innerLength / 2 + wallDist + i * spacing;
        const y1 = centerY - innerWidth / 2 + wallDist;
        const y2 = centerY + innerWidth / 2 - wallDist;
        
        if (!isFinite(x) || !isFinite(y1) || !isFinite(y2)) continue;
        
        ctx.beginPath();
        ctx.moveTo(x, y1);
        ctx.lineTo(x, y2);
        ctx.stroke();
        
        for (let y = y1; y <= y2; y += 20) {
          const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, 15);
          glowGradient.addColorStop(0, 'rgba(255, 69, 0, 0.6)');
          glowGradient.addColorStop(1, 'rgba(255, 69, 0, 0)');
          ctx.fillStyle = glowGradient;
          ctx.beginPath();
          ctx.arc(x, y, 15, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }, [rodConfig, furnaceDimensions]);

  const drawTemperatureField = useCallback((
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    innerLength: number,
    innerWidth: number
  ) => {
    if (innerLength <= 0 || innerWidth <= 0) return;
    
    const gridSize = 20;
    const cols = Math.floor(innerLength / gridSize);
    const rows = Math.floor(innerWidth / gridSize);
    
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const x = centerX - innerLength / 2 + i * gridSize + gridSize / 2;
        const y = centerY - innerWidth / 2 + j * gridSize + gridSize / 2;
        
        const distToCenter = Math.sqrt(
          Math.pow((x - centerX) / innerLength, 2) + 
          Math.pow((y - centerY) / innerWidth, 2)
        );
        
        const tempVariation = (0.5 - distToCenter) * 50;
        const localTemp = currentTemp + tempVariation;
        const tempRatio = temperature > 0 ? localTemp / temperature : 0;
        
        const alpha = 0.1 + Math.random() * 0.05;
        const red = Math.floor(255 * Math.min(Math.max(tempRatio * 1.2, 0), 1));
        const green = Math.floor(100 * Math.max(1 - tempRatio * 0.8, 0));
        
        if (isFinite(red) && isFinite(green)) {
          ctx.fillStyle = `rgba(${red}, ${green}, 30, ${alpha})`;
          ctx.fillRect(x - gridSize / 2, y - gridSize / 2, gridSize, gridSize);
        }
      }
    }
  }, [currentTemp, temperature]);

  const drawFurnace = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const totalInsulationThickness = insulationLayers.reduce((sum, layer) => sum + (layer.thickness || 0), 0);
    const totalLength = (furnaceDimensions.length || 0) + totalInsulationThickness * 2;
    const totalWidth = (furnaceDimensions.width || 0) + totalInsulationThickness * 2;
    
    if (totalLength <= 0 || totalWidth <= 0) return;
    
    const scale = Math.min(
      (canvas.width - 100) / totalLength,
      (canvas.height - 100) / totalWidth
    );

    if (!isFinite(scale) || scale <= 0) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    let currentOffset = 0;
    const colors = ['#8B4513', '#A0522D', '#CD853F', '#DEB887'];

    for (let i = insulationLayers.length - 1; i >= 0; i--) {
      const layer = insulationLayers[i];
      currentOffset += layer.thickness;
      
      const layerLength = furnaceDimensions.length + currentOffset * 2;
      const layerWidth = furnaceDimensions.width + currentOffset * 2;
      
      ctx.strokeStyle = colors[i % colors.length];
      ctx.lineWidth = 3;
      ctx.strokeRect(
        centerX - (layerLength * scale) / 2,
        centerY - (layerWidth * scale) / 2,
        layerLength * scale,
        layerWidth * scale
      );
      
      ctx.fillStyle = colors[i % colors.length] + '20';
      ctx.fillRect(
        centerX - (layerLength * scale) / 2,
        centerY - (layerWidth * scale) / 2,
        layerLength * scale,
        layerWidth * scale
      );
      
      ctx.fillStyle = '#333';
      ctx.font = '11px monospace';
      ctx.fillText(
        `Layer ${4 - i}: ${layer.thickness}mm`,
        centerX - (layerLength * scale) / 2 + 5,
        centerY - (layerWidth * scale) / 2 + 15
      );
    }

    const innerLength = furnaceDimensions.length * scale;
    const innerWidth = furnaceDimensions.width * scale;
    
    const tempRatio = currentTemp / temperature;
    const red = Math.floor(255 * Math.min(tempRatio * 1.5, 1));
    const green = Math.floor(100 * (1 - tempRatio));
    const blue = Math.floor(50 * (1 - tempRatio));
    
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(innerLength, innerWidth) / 2);
    gradient.addColorStop(0, `rgba(${red}, ${green}, ${blue}, 0.8)`);
    gradient.addColorStop(0.7, `rgba(${red * 0.8}, ${green}, ${blue}, 0.6)`);
    gradient.addColorStop(1, `rgba(${red * 0.6}, ${green}, ${blue}, 0.4)`);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(
      centerX - innerLength / 2,
      centerY - innerWidth / 2,
      innerLength,
      innerWidth
    );

    drawHeatingRods(ctx, centerX, centerY, innerLength, innerWidth);

    drawTemperatureField(ctx, centerX, centerY, innerLength, innerWidth);
  }, [insulationLayers, furnaceDimensions, currentTemp, temperature, drawHeatingRods, drawTemperatureField]);

  useEffect(() => {
    drawFurnace();
  }, [drawFurnace]);

  useEffect(() => {
    if (isSimulating) {
      const interval = setInterval(() => {
        setCurrentTemp(prev => {
          const newTemp = prev + heatingRate * simulationSpeed * 0.1;
          if (newTemp >= temperature) {
            setIsSimulating(false);
            return temperature;
          }
          return newTemp;
        });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isSimulating, heatingRate, temperature, simulationSpeed]);

  const updateLayerValue = (index: number, field: keyof InsulationLayer, value: number) => {
    const newLayers = [...insulationLayers];
    newLayers[index][field] = value;
    if (field === 'thickness' || field === 'thermalConductivity') {
      if (field === 'thickness' && newLayers[index].thermalConductivity !== 0) {
        newLayers[index].thermalResistance = value / newLayers[index].thermalConductivity;
      } else if (field === 'thermalConductivity' && value !== 0) {
        newLayers[index].thermalResistance = newLayers[index].thickness / value;
      }
    }
    setInsulationLayers(newLayers);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-orange-400 to-red-600 bg-clip-text text-transparent">
          炉膛温度场分布与均匀性交互系统
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-gray-800 rounded-lg p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">炉膛俯视图</h2>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm text-gray-400">当前温度</div>
                  <div className="text-2xl font-bold text-orange-400">
                    {currentTemp.toFixed(1)}°C
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-400">目标温度</div>
                  <div className="text-2xl font-bold text-red-400">
                    {temperature}°C
                  </div>
                </div>
              </div>
            </div>
            
            <canvas
              ref={canvasRef}
              width={800}
              height={600}
              className="w-full bg-gray-900 rounded border-2 border-gray-700"
            />
            
            <div className="mt-4 flex gap-4">
              <button
                onClick={() => {
                  setIsSimulating(!isSimulating);
                }}
                className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                  isSimulating
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {isSimulating ? '暂停模拟' : '开始模拟'}
              </button>
              <button
                onClick={() => {
                  setCurrentTemp(25);
                  setIsSimulating(false);
                }}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg font-semibold transition-all"
              >
                重置
              </button>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
              <h3 className="text-xl font-semibold mb-4 border-b border-gray-700 pb-2">
                温度设置
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    目标温度: {temperature}°C
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1720"
                    value={temperature}
                    onChange={(e) => setTemperature(Number(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  />
                  <input
                    type="number"
                    value={temperature}
                    onChange={(e) => setTemperature(Math.min(1720, Math.max(0, Number(e.target.value))))}
                    className="w-full mt-2 px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-orange-500 focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    升温速率: {heatingRate}°C/s
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="20"
                    step="0.1"
                    value={heatingRate}
                    onChange={(e) => setHeatingRate(Number(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    模拟速度: {simulationSpeed}x
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="10"
                    step="0.1"
                    value={simulationSpeed}
                    onChange={(e) => setSimulationSpeed(Number(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
              <h3 className="text-xl font-semibold mb-4 border-b border-gray-700 pb-2">
                炉膛尺寸 (mm)
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">长度</label>
                  <input
                    type="number"
                    value={furnaceDimensions.length}
                    onChange={(e) => setFurnaceDimensions({...furnaceDimensions, length: Number(e.target.value)})}
                    className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">宽度</label>
                  <input
                    type="number"
                    value={furnaceDimensions.width}
                    onChange={(e) => setFurnaceDimensions({...furnaceDimensions, width: Number(e.target.value)})}
                    className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">高度</label>
                  <input
                    type="number"
                    value={furnaceDimensions.height}
                    onChange={(e) => setFurnaceDimensions({...furnaceDimensions, height: Number(e.target.value)})}
                    className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
            <h3 className="text-xl font-semibold mb-4 border-b border-gray-700 pb-2">
              保温层配置
            </h3>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {insulationLayers.map((layer, index) => (
                <div key={index} className="bg-gray-700 rounded p-4 border-l-4 border-orange-500">
                  <h4 className="font-semibold mb-3">第 {index + 1} 层</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs mb-1">厚度 (mm)</label>
                      <input
                        type="number"
                        value={layer.thickness}
                        onChange={(e) => updateLayerValue(index, 'thickness', Number(e.target.value))}
                        className="w-full px-2 py-1 text-sm bg-gray-600 rounded border border-gray-500 focus:border-orange-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs mb-1">导热系数</label>
                      <input
                        type="number"
                        step="0.01"
                        value={layer.thermalConductivity}
                        onChange={(e) => updateLayerValue(index, 'thermalConductivity', Number(e.target.value))}
                        className="w-full px-2 py-1 text-sm bg-gray-600 rounded border border-gray-500 focus:border-orange-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs mb-1">热阻</label>
                      <input
                        type="number"
                        value={layer.thermalResistance.toFixed(2)}
                        onChange={(e) => updateLayerValue(index, 'thermalResistance', Number(e.target.value))}
                        className="w-full px-2 py-1 text-sm bg-gray-600 rounded border border-gray-500 focus:border-orange-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
            <h3 className="text-xl font-semibold mb-4 border-b border-gray-700 pb-2">
              硅钼棒配置
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm mb-1">总数量</label>
                  <input
                    type="number"
                    value={rodConfig.totalCount}
                    onChange={(e) => setRodConfig({...rodConfig, totalCount: Number(e.target.value)})}
                    className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">热端长度 (mm)</label>
                  <input
                    type="number"
                    value={rodConfig.hotEndLength}
                    onChange={(e) => setRodConfig({...rodConfig, hotEndLength: Number(e.target.value)})}
                    className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">冷端长度 (mm)</label>
                  <input
                    type="number"
                    value={rodConfig.coldEndLength}
                    onChange={(e) => setRodConfig({...rodConfig, coldEndLength: Number(e.target.value)})}
                    className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">长度方向数量</label>
                  <input
                    type="number"
                    value={rodConfig.lengthDirection}
                    onChange={(e) => setRodConfig({...rodConfig, lengthDirection: Number(e.target.value)})}
                    className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">宽度方向数量</label>
                  <input
                    type="number"
                    value={rodConfig.widthDirection}
                    onChange={(e) => setRodConfig({...rodConfig, widthDirection: Number(e.target.value)})}
                    className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">离内壁距离 (mm)</label>
                  <input
                    type="number"
                    value={rodConfig.wallDistance}
                    onChange={(e) => setRodConfig({...rodConfig, wallDistance: Number(e.target.value)})}
                    className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">棒间距 (mm)</label>
                  <input
                    type="number"
                    value={rodConfig.spacing}
                    onChange={(e) => setRodConfig({...rodConfig, spacing: Number(e.target.value)})}
                    className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">棒方向</label>
                  <select
                    value={rodConfig.orientation}
                    onChange={(e) => setRodConfig({...rodConfig, orientation: e.target.value as 'parallel' | 'perpendicular'})}
                    className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-orange-500 focus:outline-none"
                  >
                    <option value="parallel">平行于炉壁</option>
                    <option value="perpendicular">垂直于炉壁</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-gray-800 rounded-lg p-6 shadow-xl">
          <h3 className="text-xl font-semibold mb-4 border-b border-gray-700 pb-2">
            系统说明
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
            <div>
              <h4 className="font-semibold text-orange-400 mb-2">可视化说明</h4>
              <ul className="space-y-1 list-disc list-inside">
                <li>不同颜色的矩形表示不同的保温层</li>
                <li>红色点或线表示硅钼棒位置</li>
                <li>温度场通过颜色渐变显示，红色表示高温</li>
                <li>中心区域温度最高，边缘区域温度较低</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-orange-400 mb-2">物理模型</h4>
              <ul className="space-y-1 list-disc list-inside">
                <li>基于纳维-斯托克斯方程的温度场分布</li>
                <li>考虑热传导、对流和辐射效应</li>
                <li>保温层热阻计算：R = 厚度 / 导热系数</li>
                <li>温度均匀性受硅钼棒布局影响</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-orange-400 mb-2">操作提示</h4>
              <ul className="space-y-1 list-disc list-inside">
                <li>调整目标温度和升温速率后点击&ldquo;开始模拟&rdquo;</li>
                <li>使用模拟速度滑块加快或减慢动画</li>
                <li>修改炉膛参数实时查看温度场变化</li>
                <li>优化硅钼棒布局以提高温度均匀性</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-orange-400 mb-2">技术特性</h4>
              <ul className="space-y-1 list-disc list-inside">
                <li>温度范围：0-1720°C</li>
                <li>4层可配置保温结构</li>
                <li>灵活的硅钼棒布局配置</li>
                <li>实时温度场可视化</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
