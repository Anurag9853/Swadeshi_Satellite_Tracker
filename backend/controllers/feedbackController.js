const Feedback = require('../models/Feedback');

exports.submitFeedback = async (req, res) => {
  try {
    const { name, email, message, rating } = req.body;

    if (!name || !email || !message || !rating) {
      return res.status(400).json({ message: 'Missing feedback fields' });
    }

    const entry = await Feedback.create({ name, email, message, rating });
    res.status(201).json({ message: 'Feedback received', data: entry });
  } catch (error) {
    res.status(500).json({ message: 'Failed to submit feedback', error: error.message });
  }
};

exports.getFeedback = async (_req, res) => {
  try {
    const feedbackList = await Feedback.find().sort({ createdAt: -1 }).limit(50);
    res.json(feedbackList);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch feedback', error: error.message });
  }
};

