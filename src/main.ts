import './style.css'

const canvas = document.querySelector<HTMLCanvasElement>('#board')
if (!canvas) throw new Error('Missing #board canvas')

// Slice 1: an empty board. Drawing and the game loop arrive in slice 3.
const ctx = canvas.getContext('2d')
if (!ctx) throw new Error('2D canvas not supported')

canvas.width = 600
canvas.height = 600
ctx.fillStyle = '#ffffff'
ctx.fillRect(0, 0, canvas.width, canvas.height)
