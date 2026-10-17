const transactionService = require('../services/transactionService');
const auditService = require('../services/auditService');

async function list(req, res, next) {
  try {
    const {
      search,
      riskLevel,
      status,
      dateFrom,
      dateTo,
      amountMin,
      amountMax,
      sortBy,
      sortDir,
      page,
      pageSize,
    } = req.query;

    const result = await transactionService.listTransactions({
      search,
      riskLevel,
      status,
      dateFrom,
      dateTo,
      amountMin,
      amountMax,
      sortBy,
      sortDir,
      page,
      pageSize,
    });

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const txn = await transactionService.getTransactionById(req.params.id);
    res.status(200).json({ transaction: txn });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const txn = await transactionService.createTransaction(req.body);
    await auditService.logAction({
      userId: req.user.id,
      transactionId: txn.id,
      action: 'Transaction created',
      details: `${req.user.name} created transaction ${txn.txnRef}.`,
    });
    res.status(201).json({ transaction: txn });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const txn = await transactionService.updateTransaction(req.params.id, req.body);
    await auditService.logAction({
      userId: req.user.id,
      transactionId: txn.id,
      action: 'Transaction updated',
      details: `${req.user.name} updated transaction ${txn.txnRef}.`,
    });
    res.status(200).json({ transaction: txn });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const txn = await transactionService.getTransactionById(req.params.id);
    await transactionService.deleteTransaction(req.params.id);
    await auditService.logAction({
      userId: req.user.id,
      transactionId: null,
      action: 'Transaction deleted',
      details: `${req.user.name} deleted transaction ${txn.txnRef}.`,
    });
    res.status(200).json({ message: 'Transaction deleted successfully.' });
  } catch (err) {
    next(err);
  }
}

async function analyze(req, res, next) {
  try {
    const txn = await transactionService.analyzeTransaction(req.params.id);
    await auditService.logAction({
      userId: req.user.id,
      transactionId: txn.id,
      action: 'Risk analysis performed',
      details: `${req.user.name} ran risk analysis for ${txn.txnRef}. Score: ${txn.riskScore} (${txn.riskLevel}).`,
    });
    res.status(200).json({
      riskScore: txn.riskScore,
      riskLevel: txn.riskLevel,
      reasons: txn.reasons,
      transaction: txn,
    });
  } catch (err) {
    next(err);
  }
}

async function updateStatus(req, res, next) {
  try {
    const { status } = req.body;
    const txn = await transactionService.updateStatus(req.params.id, status);
    await auditService.logAction({
      userId: req.user.id,
      transactionId: txn.id,
      action: 'Transaction status changed',
      details: `${req.user.name} marked ${txn.txnRef} as "${status}".`,
    });
    res.status(200).json({ transaction: txn });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getById, create, update, remove, analyze, updateStatus };
