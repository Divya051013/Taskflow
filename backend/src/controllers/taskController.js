const Task = require('../models/Task');
const Project = require('../models/Project');

exports.createTask = async (req, res, next) => {
  try {
    const { title, description, priority, dueDate, assignedTo, tags } = req.body;
    const { projectId } = req.params;
    
    if (!title) return res.status(400).json({ message: 'Task title is required' });
    
    // Validate assignee is project member
    if (assignedTo) {
      const project = await Project.findById(projectId);
      const isMember = project.members.find(m => m.user.toString() === assignedTo);
      if (!isMember) return res.status(400).json({ message: 'Assignee must be a project member' });
    }
    
    const task = await Task.create({
      title, description, priority, dueDate, tags,
      assignedTo: assignedTo || null,
      project: projectId,
      createdBy: req.user._id
    });
    
    await task.populate('assignedTo', 'name email');
    await task.populate('createdBy', 'name email');
    res.status(201).json({ message: 'Task created', task });
  } catch (err) { next(err); }
};

exports.getTasks = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { status, priority, assignedTo, overdue } = req.query;
    
    const filter = { project: projectId };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (overdue === 'true') {
      filter.dueDate = { $lt: new Date() };
      filter.status = { $ne: 'done' };
    }
    
    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    
    res.json({ tasks });
  } catch (err) { next(err); }
};

exports.getTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.taskId)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('project', 'name');
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json({ task });
  } catch (err) { next(err); }
};

exports.updateTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    
    // Members can only update status of their own tasks
    if (req.memberRole === 'member') {
      const isAssignee = task.assignedTo && task.assignedTo.toString() === req.user._id.toString();
      if (!isAssignee) return res.status(403).json({ message: 'You can only update tasks assigned to you' });
      
      const { status } = req.body;
      if (!status) return res.status(400).json({ message: 'Members can only update task status' });
      task.status = status;
    } else {
      // Admin can update everything
      const { title, description, priority, dueDate, assignedTo, status, tags } = req.body;
      if (title) task.title = title;
      if (description !== undefined) task.description = description;
      if (priority) task.priority = priority;
      if (dueDate !== undefined) task.dueDate = dueDate;
      if (assignedTo !== undefined) task.assignedTo = assignedTo || null;
      if (status) task.status = status;
      if (tags) task.tags = tags;
    }
    
    await task.save();
    await task.populate('assignedTo', 'name email');
    await task.populate('createdBy', 'name email');
    res.json({ message: 'Task updated', task });
  } catch (err) { next(err); }
};

exports.deleteTask = async (req, res, next) => {
  try {
    if (req.memberRole !== 'admin') {
      return res.status(403).json({ message: 'Only admins can delete tasks' });
    }
    const task = await Task.findByIdAndDelete(req.params.taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json({ message: 'Task deleted' });
  } catch (err) { next(err); }
};
