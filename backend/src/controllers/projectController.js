const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');

exports.createProject = async (req, res, next) => {
  try {
    const { name, description, color } = req.body;
    if (!name) return res.status(400).json({ message: 'Project name is required' });
    
    const project = await Project.create({
      name, description, color,
      createdBy: req.user._id,
      members: [{ user: req.user._id, role: 'admin' }]
    });
    await project.populate('members.user', 'name email');
    res.status(201).json({ message: 'Project created', project });
  } catch (err) { next(err); }
};

exports.getProjects = async (req, res, next) => {
  try {
    const projects = await Project.find({ 'members.user': req.user._id, isArchived: false })
      .populate('members.user', 'name email')
      .populate('createdBy', 'name email')
      .sort('-createdAt');
    
    const projectsWithCount = await Promise.all(projects.map(async (p) => {
      const taskCount = await Task.countDocuments({ project: p._id });
      const completedCount = await Task.countDocuments({ project: p._id, status: 'done' });
      return { ...p.toObject(), taskCount, completedCount };
    }));
    res.json({ projects: projectsWithCount });
  } catch (err) { next(err); }
};

exports.getProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.projectId)
      .populate('members.user', 'name email')
      .populate('createdBy', 'name email');
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json({ project });
  } catch (err) { next(err); }
};

exports.updateProject = async (req, res, next) => {
  try {
    const { name, description, color } = req.body;
    const project = await Project.findByIdAndUpdate(
      req.params.projectId, { name, description, color }, { new: true, runValidators: true }
    ).populate('members.user', 'name email');
    res.json({ message: 'Project updated', project });
  } catch (err) { next(err); }
};

exports.deleteProject = async (req, res, next) => {
  try {
    await Task.deleteMany({ project: req.params.projectId });
    await Project.findByIdAndDelete(req.params.projectId);
    res.json({ message: 'Project deleted successfully' });
  } catch (err) { next(err); }
};

exports.addMember = async (req, res, next) => {
  try {
    const { email, role = 'member' } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });
    
    const userToAdd = await User.findOne({ email });
    if (!userToAdd) return res.status(404).json({ message: 'User not found with that email' });
    
    const project = req.project;
    const alreadyMember = project.members.find(m => m.user.toString() === userToAdd._id.toString());
    if (alreadyMember) return res.status(409).json({ message: 'User is already a member' });
    
    project.members.push({ user: userToAdd._id, role });
    await project.save();
    await project.populate('members.user', 'name email');
    res.json({ message: 'Member added successfully', project });
  } catch (err) { next(err); }
};

exports.removeMember = async (req, res, next) => {
  try {
    const { memberId } = req.params;
    const project = req.project;
    
    if (project.createdBy.toString() === memberId) {
      return res.status(400).json({ message: 'Cannot remove the project creator' });
    }
    project.members = project.members.filter(m => m.user.toString() !== memberId);
    await project.save();
    await project.populate('members.user', 'name email');
    res.json({ message: 'Member removed', project });
  } catch (err) { next(err); }
};

exports.updateMemberRole = async (req, res, next) => {
  try {
    const { memberId } = req.params;
    const { role } = req.body;
    const project = req.project;
    
    const member = project.members.find(m => m.user.toString() === memberId);
    if (!member) return res.status(404).json({ message: 'Member not found' });
    member.role = role;
    await project.save();
    await project.populate('members.user', 'name email');
    res.json({ message: 'Role updated', project });
  } catch (err) { next(err); }
};
