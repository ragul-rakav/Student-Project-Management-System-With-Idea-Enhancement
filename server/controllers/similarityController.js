const { similarityService } = require('../services/similarityService');

exports.checkOriginality = async (req, res) => {
  try {
    const { title, abstract, tech, category, problem_statement, objectives, methodology } = req.body;

    if (!title && !abstract) {
      return res.status(400).json({
        success: false,
        message: 'At least title or abstract is required to analyze originality'
      });
    }

    const report = await similarityService.analyzeOriginality({
      title,
      abstract,
      tech,
      category,
      problem_statement,
      objectives,
      methodology
    });

    return res.json({
      success: true,
      report
    });
  } catch (err) {
    console.error('Similarity check error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to analyze project originality: ' + err.message
    });
  }
};

exports.reindexProjects = async (req, res) => {
  try {
    await similarityService.indexExistingProjects();
    return res.json({
      success: true,
      message: 'All existing project submissions successfully vectorized and re-indexed in vector store.'
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Reindex failed: ' + err.message
    });
  }
};
