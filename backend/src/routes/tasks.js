const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect } = require('../middleware/auth');
const { requireProjectMember } = require('../middleware/projectAccess');
const { createTask, getTasks, getTask, updateTask, deleteTask } = require('../controllers/taskController');

router.use(protect);
router.use(requireProjectMember);

router.route('/').get(getTasks).post(createTask);
router.route('/:taskId').get(getTask).patch(updateTask).delete(deleteTask);

module.exports = router;
