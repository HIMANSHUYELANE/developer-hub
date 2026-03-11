import express from 'express'
import Project from '../models/Project.js'
import { authRequired } from '../middleware/auth.js'

const router = express.Router()

router.get('/public', async (req, res) => {
  try {
    const sampleSize = Number(req.query.limit) || 6
    const randomProjects = await Project.aggregate([{ $sample: { size: sampleSize } }])
    const populated = await Project.populate(randomProjects, {
      path: 'owner',
      select: 'name avatarUrl skills',
    })
    return res.json(populated)
  } catch (err) {
    console.error('Public projects error', err)
    return res.status(500).json({ message: 'Server error' })
  }
})

router.post('/', authRequired, async (req, res) => {
  try {
    const { title, description, requiredSkills, teamSize, status } = req.body

    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required' })
    }

    const project = await Project.create({
      owner: req.user._id,
      title,
      description,
      requiredSkills: Array.isArray(requiredSkills)
        ? requiredSkills
        : (requiredSkills || '')
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
      teamSize: teamSize || 1,
      status: status || 'Planning',
      members: [req.user._id],
    })

    return res.status(201).json(project)
  } catch (err) {
    console.error('Create project error', err)
    return res.status(500).json({ message: 'Server error' })
  }
})

router.get('/', authRequired, async (req, res) => {
  try {
    const { status, skill, owner } = req.query
    const filter = {}

    if (status) filter.status = status
    if (owner) filter.owner = owner
    if (skill) filter.requiredSkills = { $regex: skill, $options: 'i' }

    const projects = await Project.find(filter)
      .populate('owner', 'name skills techStack avatarUrl')
      .sort({ createdAt: -1 })

    return res.json(projects)
  } catch (err) {
    console.error('List projects error', err)
    return res.status(500).json({ message: 'Server error' })
  }
})

router.get('/me', authRequired, async (req, res) => {
  try {
    const projects = await Project.find({ owner: req.user._id })
      .populate('members', 'name avatarUrl skills')
      .sort({ createdAt: -1 })
    return res.json(projects)
  } catch (err) {
    console.error('My projects error', err)
    return res.status(500).json({ message: 'Server error' })
  }
})

router.get('/:id', authRequired, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name avatarUrl skills')
      .populate('members', 'name avatarUrl skills')
    if (!project) {
      return res.status(404).json({ message: 'Project not found' })
    }
    return res.json(project)
  } catch (err) {
    console.error('Get project error', err)
    return res.status(500).json({ message: 'Server error' })
  }
})

router.put('/:id', authRequired, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
    if (!project) {
      return res.status(404).json({ message: 'Project not found' })
    }
    if (String(project.owner) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Only the owner can update the project' })
    }

    const { title, description, requiredSkills, teamSize, status } = req.body

    if (title !== undefined) project.title = title
    if (description !== undefined) project.description = description
    if (requiredSkills !== undefined) {
      project.requiredSkills = Array.isArray(requiredSkills)
        ? requiredSkills
        : (requiredSkills || '')
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
    }
    if (teamSize !== undefined) project.teamSize = teamSize
    if (status !== undefined) project.status = status

    await project.save()
    return res.json(project)
  } catch (err) {
    console.error('Update project error', err)
    return res.status(500).json({ message: 'Server error' })
  }
})

router.delete('/:id', authRequired, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
    if (!project) {
      return res.status(404).json({ message: 'Project not found' })
    }
    if (String(project.owner) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Only the owner can delete the project' })
    }
    await project.deleteOne()
    return res.json({ message: 'Project deleted' })
  } catch (err) {
    console.error('Delete project error', err)
    return res.status(500).json({ message: 'Server error' })
  }
})

export default router

