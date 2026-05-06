const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requireProjectAdmin, requireProjectMember } = require('../middleware/projectAccess');
const {
  createProject, getProjects, getProject, updateProject, deleteProject,
  addMember, removeMember, updateMemberRole
} = require('../controllers/projectController');

router.use(protect);

router.route('/').get(getProjects).post(createProject);
router.route('/:projectId').get(requireProjectMember, getProject)
  .patch(requireProjectAdmin, updateProject).delete(requireProjectAdmin, deleteProject);

router.post('/:projectId/members', requireProjectAdmin, addMember);
router.delete('/:projectId/members/:memberId', requireProjectAdmin, removeMember);
router.patch('/:projectId/members/:memberId', requireProjectAdmin, updateMemberRole);

module.exports = router;
