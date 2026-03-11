import express from 'express'
import JoinRequest from '../models/JoinRequest.js'
import Project from '../models/Project.js'
import { authRequired } from '../middleware/auth.js'

const router = express.Router()

router.post('/', authRequired, async (req, res) => {
  try {
    const { projectId, message } = req.body
    if (!projectId) {
      return res.status(400).json({ message: 'projectId is required' })
    }

    const project = await Project.findById(projectId)
    if (!project) {
      return res.status(404).json({ message: 'Project not found' })
    }

    const existing = await JoinRequest.findOne({
      project: projectId,
      sender: req.user._id,
      status: 'Pending',
    })
    if (existing) {
      return res.status(400).json({ message: 'You already have a pending request' })
    }

    const joinRequest = await JoinRequest.create({
      project: projectId,
      sender: req.user._id,
      recipient: project.owner,
      message,
    })

    const populated = await joinRequest.populate([
      { path: 'project', select: 'title' },
      { path: 'sender', select: 'name avatarUrl' },
      { path: 'recipient', select: 'name avatarUrl' },
    ])

    return res.status(201).json(populated)
  } catch (err) {
    console.error('Create join request error', err)
    return res.status(500).json({ message: 'Server error' })
  }
})

router.get('/incoming', authRequired, async (req, res) => {
  try {
    const requests = await JoinRequest.find({ recipient: req.user._id })
      .populate('project', 'title')
      .populate('sender', 'name avatarUrl skills')
      .sort({ createdAt: -1 })

    return res.json(requests)
  } catch (err) {
    console.error('Incoming requests error', err)
    return res.status(500).json({ message: 'Server error' })
  }
})

router.get('/outgoing', authRequired, async (req, res) => {
  try {
    const requests = await JoinRequest.find({ sender: req.user._id })
      .populate('project', 'title')
      .populate('recipient', 'name avatarUrl')
      .sort({ createdAt: -1 })

    return res.json(requests)
  } catch (err) {
    console.error('Outgoing requests error', err)
    return res.status(500).json({ message: 'Server error' })
  }
})

router.patch('/:id', authRequired, async (req, res) => {
  try {
    const { status } = req.body
    if (!['Accepted', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be Accepted or Rejected' })
    }

    const joinRequest = await JoinRequest.findById(req.params.id)
    if (!joinRequest) {
      return res.status(404).json({ message: 'Request not found' })
    }
    if (String(joinRequest.recipient) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Only the recipient can update this request' })
    }
    if (joinRequest.status !== 'Pending') {
      return res.status(400).json({ message: 'Request is already processed' })
    }

    joinRequest.status = status
    await joinRequest.save()

    if (status === 'Accepted') {
      const project = await Project.findById(joinRequest.project)
      if (project && !project.members.includes(joinRequest.sender)) {
        project.members.push(joinRequest.sender)
        await project.save()
      }
    }

    const populated = await joinRequest.populate([
      { path: 'project', select: 'title' },
      { path: 'sender', select: 'name avatarUrl' },
      { path: 'recipient', select: 'name avatarUrl' },
    ])

    return res.json(populated)
  } catch (err) {
    console.error('Update request error', err)
    return res.status(500).json({ message: 'Server error' })
  }
})

export default router

