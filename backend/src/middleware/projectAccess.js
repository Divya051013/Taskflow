const Project = require('../models/Project');

const requireProjectMember = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.projectId || req.body.project);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    
    const memberEntry = project.members.find(m => m.user.toString() === req.user._id.toString());
    if (!memberEntry) return res.status(403).json({ message: 'Access denied. Not a project member.' });
    
    req.project = project;
    req.memberRole = memberEntry.role;
    next();
  } catch (err) { next(err); }
};

const requireProjectAdmin = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.projectId || req.body.project);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    
    const memberEntry = project.members.find(m => m.user.toString() === req.user._id.toString());
    if (!memberEntry || memberEntry.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }
    req.project = project;
    req.memberRole = 'admin';
    next();
  } catch (err) { next(err); }
};

module.exports = { requireProjectMember, requireProjectAdmin };
