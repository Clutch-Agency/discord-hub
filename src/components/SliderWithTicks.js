"use client"

import { useState, useEffect } from "react"

export default function SliderWithTicks({
  label,
  description,
  value,
  onChange,
  min,
  max,
  step,
  unit,
  infiniteValue = -1,
  infiniteLabel = "∞",
  displayTicks = [], // Array de valores para exibir ticks
  name, // Adicionado para o atributo name do input
}) {
  const [currentValue, setCurrentValue] = useState(value)

  useEffect(() => {
    setCurrentValue(value)
  }, [value])

  const handleChange = (e) => {
    const newValue = parseInt(e.target.value)
    setCurrentValue(newValue)
    if (onChange) {
      onChange(e)
    }
  }

  const getDisplayValue = (val) => {
    if (val === infiniteValue) {
      return infiniteLabel
    }
    return `${val}${unit ? ` ${unit}` : ""}`
  }

  // Função para calcular a posição do tick na barra
  const getTickPosition = (tickValue) => {
    const percentage = ((tickValue - min) / (max - min)) * 100
    return `${percentage}%`
  }

  return (
    <div className="mb-6">
      <label className="block text-white text-lg font-semibold mb-1">
        {label}
      </label>
      {description && (
        <p className="text-clutch-gray-lighter text-sm mb-4">
          {description}
        </p>
      )}

      <div className="relative w-full">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={currentValue}
          onChange={handleChange}
          name={name} // Atributo name adicionado aqui
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-clutch-pink"
        />
        <div className="relative w-full h-4 mt-2">
          {displayTicks.map((tick, index) => (
            <div
              key={index}
              className="absolute text-center text-clutch-gray-lighter text-xs"
              style={{ left: getTickPosition(tick.value), transform: 'translateX(-50%)' }}
            >
              {tick.label}
            </div>
          ))}
        </div>
      </div>
      <p className="text-clutch-gray-lighter text-sm mt-2">
        Valor atual: <span className="font-medium text-white">{getDisplayValue(currentValue)}</span>
      </p>
    </div>
  )
}