const Task = require('../models/Task');
const Project = require('../models/Project');

exports.getDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id;
    
    // Get all projects user is part of
    const projects = await Project.find({ 'members.user': userId, isArchived: false });
    const projectIds = projects.map(p => p._id);
    
    // All tasks in user's projects
    const [totalTasks, todoTasks, inProgressTasks, doneTasks, overdueTasks] = await Promise.all([
      Task.countDocuments({ project: { $in: projectIds } }),
      Task.countDocuments({ project: { $in: projectIds }, status: 'todo' }),
      Task.countDocuments({ project: { $in: projectIds }, status: 'in_progress' }),
      Task.countDocuments({ project: { $in: projectIds }, status: 'done' }),
      Task.countDocuments({ project: { $in: projectIds }, status: { $ne: 'done' }, dueDate: { $lt: new Date() } })
    ]);
    
    // Tasks assigned to current user
    const myTasks = await Task.find({ assignedTo: userId, project: { $in: projectIds } })
      .populate('project', 'name color')
      .sort({ dueDate: 1, createdAt: -1 })
      .limit(10);
    
    // Tasks per member (for admin view)
    const tasksByMember = await Task.aggregate([
      { $match: { project: { $in: projectIds }, assignedTo: { $ne: null } } },
      { $group: { _id: '$assignedTo', count: { $sum: 1 }, done: { $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] } } } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { 'user.name': 1, 'user.email': 1, count: 1, done: 1 } }
    ]);
    
    // Tasks by priority
    const tasksByPriority = await Task.aggregate([
      { $match: { project: { $in: projectIds }, status: { $ne: 'done' } } },
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);
    
    // Recent activity (latest 5 tasks updated)
    const recentTasks = await Task.find({ project: { $in: projectIds } })
      .populate('project', 'name color')
      .populate('assignedTo', 'name')
      .sort({ updatedAt: -1 })
      .limit(5);
    
    res.json({
      stats: { totalTasks, todoTasks, inProgressTasks, doneTasks, overdueTasks, totalProjects: projects.length },
      myTasks,
      tasksByMember,
      tasksByPriority,
      recentTasks
    });
  } catch (err) { next(err); }
};
