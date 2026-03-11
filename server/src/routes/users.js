import express from 'express'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import User from '../models/User.js'
import { authRequired } from '../middleware/auth.js'

const router = express.Router()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../../uploads/avatars'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `${req.user._id}-avatar${ext}`)
  },
})

const upload = multer({ storage })

router.get('/me', authRequired, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    return res.json(user)
  } catch (err) {
    console.error('Get me error', err)
    return res.status(500).json({ message: 'Server error' })
  }
})

router.put('/me', authRequired, async (req, res) => {
  try {
    const { bio, skills, techStack, experienceLevel, github, name } = req.body

    const update = {
      name,
      bio,
      experienceLevel,
      github,
    }

    if (skills) {
      update.skills = Array.isArray(skills)
        ? skills
        : skills
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
    }

    if (techStack) {
      update.techStack = Array.isArray(techStack)
        ? techStack
        : techStack
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
    }

    const user = await User.findByIdAndUpdate(req.user._id, update, {
      new: true,
      runValidators: true,
    })

    return res.json(user)
  } catch (err) {
    console.error('Update profile error', err)
    return res.status(500).json({ message: 'Server error' })
  }
})

router.post('/me/avatar', authRequired, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' })
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatarUrl },
      { new: true, runValidators: true },
    )

    return res.json(user)
  } catch (err) {
    console.error('Upload avatar error', err)
    return res.status(500).json({ message: 'Server error' })
  }
})

router.get('/search', authRequired, async (req, res) => {
  try {
    const { skill, tech, q } = req.query

    const filter = {}
    if (skill) {
      filter.skills = { $regex: skill, $options: 'i' }
    }
    if (tech) {
      filter.techStack = { $regex: tech, $options: 'i' }
    }
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { bio: { $regex: q, $options: 'i' } },
        { skills: { $regex: q, $options: 'i' } },
        { techStack: { $regex: q, $options: 'i' } },
      ]
    }

    const users = await User.find(filter).select('-password')
    return res.json(users)
  } catch (err) {
    console.error('Search users error', err)
    return res.status(500).json({ message: 'Server error' })
  }
})

router.get('/:id', authRequired, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password')
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }
    return res.json(user)
  } catch (err) {
    console.error('Get user error', err)
    return res.status(500).json({ message: 'Server error' })
  }
})

export default router

