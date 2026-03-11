import mongoose from 'mongoose'
import dotenv from 'dotenv'
import User from './models/User.js'
import Project from './models/Project.js'
import JoinRequest from './models/JoinRequest.js'

dotenv.config()

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/dev-collab-hub'

async function runSeed() {
  try {
    await mongoose.connect(MONGO_URI)
    console.log('Connected to MongoDB, clearing old data...')

    await Promise.all([User.deleteMany({}), Project.deleteMany({}), JoinRequest.deleteMany({})])

    const alice = await User.create({
      name: 'Alice Johnson',
      email: 'alice@example.com',
      password: 'password123',
      bio: 'Full-stack developer who loves TypeScript and clean code.',
      skills: ['JavaScript', 'TypeScript', 'React', 'Node.js'],
      techStack: ['React', 'Node.js', 'MongoDB', 'Express'],
      experienceLevel: 'Intermediate',
      github: 'https://github.com/alice',
    })

    const bob = await User.create({
      name: 'Bob Singh',
      email: 'bob@example.com',
      password: 'password123',
      bio: 'Backend-focused dev interested in microservices and DevOps.',
      skills: ['Node.js', 'Express', 'MongoDB', 'Docker'],
      techStack: ['Node.js', 'MongoDB'],
      experienceLevel: 'Advanced',
      github: 'https://github.com/bob',
    })

    const carol = await User.create({
      name: 'Carol Patel',
      email: 'carol@example.com',
      password: 'password123',
      bio: 'Frontend developer exploring design systems and accessibility.',
      skills: ['React', 'Tailwind CSS', 'Figma'],
      techStack: ['React', 'Vite'],
      experienceLevel: 'Beginner',
      github: 'https://github.com/carol',
    })

    const project1 = await Project.create({
      owner: alice._id,
      title: 'Open Source Issue Tracker',
      description:
        'A web app where maintainers can post issues and contributors can find beginner-friendly tasks.',
      requiredSkills: ['React', 'Node.js', 'MongoDB'],
      teamSize: 4,
      status: 'Planning',
      members: [alice._id],
    })

    const project2 = await Project.create({
      owner: bob._id,
      title: 'Real-time Dev Chat',
      description:
        'Socket.io based real-time chat for development teams with channels and code snippets.',
      requiredSkills: ['Node.js', 'Socket.io', 'React'],
      teamSize: 5,
      status: 'In Progress',
      members: [bob._id],
    })

    await JoinRequest.create({
      project: project1._id,
      sender: carol._id,
      recipient: alice._id,
      message: 'Hi, I would love to handle the frontend components!',
      status: 'Pending',
    })

    await JoinRequest.create({
      project: project2._id,
      sender: alice._id,
      recipient: bob._id,
      message: 'I can help with the React UI and Socket.io integration.',
      status: 'Accepted',
    })

    console.log('Seed data created successfully.')
    console.log('Users:')
    console.log('  alice@example.com / password123')
    console.log('  bob@example.com / password123')
    console.log('  carol@example.com / password123')

    await mongoose.disconnect()
    console.log('Disconnected from MongoDB.')
    process.exit(0)
  } catch (err) {
    console.error('Seed error', err)
    process.exit(1)
  }
}

runSeed()

