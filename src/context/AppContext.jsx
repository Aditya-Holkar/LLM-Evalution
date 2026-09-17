import { createContext, useContext, useReducer, useCallback, useEffect } from 'react'
import { METRIC_IDS } from '../config/constants'

const AppContext = createContext(null)
const STORAGE_KEY = 'llm-eval-state'
const DEFAULT_MODELS = ['openai/gpt-5.6-sol', 'anthropic/claude-fable-5.1', 'openai/gpt-oss-120b']

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return { triesUsed: 0, isUnlocked: false, manualVotes: {}, selectedMetrics: METRIC_IDS, selectedModels: DEFAULT_MODELS }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ triesUsed: state.triesUsed, isUnlocked: state.isUnlocked, manualVotes: state.manualVotes, selectedMetrics: state.selectedMetrics, selectedModels: state.selectedModels }))
  } catch {}
}

const savedState = loadState()
const validMetrics = new Set(METRIC_IDS)
const migratedMetrics = Array.isArray(savedState.selectedMetrics) ? savedState.selectedMetrics.filter((id) => validMetrics.has(id)) : METRIC_IDS
const migratedModels = Array.isArray(savedState.selectedModels) && savedState.selectedModels.length ? savedState.selectedModels : DEFAULT_MODELS

const initialState = { selectedModels: migratedModels, results: [], isEvaluating: false, selectedMetrics: migratedMetrics.length ? migratedMetrics : METRIC_IDS, ...savedState }
initialState.selectedMetrics = migratedMetrics.length ? migratedMetrics : METRIC_IDS
initialState.selectedModels = migratedModels

function reducer(state, action) {
  switch (action.type) {
    case 'SELECT_MODEL': {
      const selectedModels = state.selectedModels.includes(action.id) ? state.selectedModels.filter((m) => m !== action.id) : [...state.selectedModels, action.id]
      return { ...state, selectedModels }
    }
    case 'START_EVALUATION': return { ...state, isEvaluating: true, results: [] }
    case 'SET_RESULTS': return { ...state, results: action.payload, isEvaluating: false, triesUsed: state.triesUsed + 1 }
    case 'CLEAR_RESULTS': return { ...state, results: [], isEvaluating: false }
    case 'UNLOCK': return { ...state, isUnlocked: true }
    case 'VOTE': return { ...state, manualVotes: { ...state.manualVotes, [action.modelId]: action.vote } }
    case 'TOGGLE_METRIC': return { ...state, selectedMetrics: state.selectedMetrics.includes(action.id) ? state.selectedMetrics.filter((m) => m !== action.id) : [...state.selectedMetrics, action.id] }
    case 'SET_ALL_METRICS': return { ...state, selectedMetrics: action.ids }
    default: return state
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  useEffect(() => { saveState(state) }, [state.triesUsed, state.isUnlocked, state.manualVotes, state.selectedMetrics, state.selectedModels])
  const selectModel = useCallback((id) => dispatch({ type: 'SELECT_MODEL', id }), [])
  const startEvaluation = useCallback(() => dispatch({ type: 'START_EVALUATION' }), [])
  const setResults = useCallback((results) => dispatch({ type: 'SET_RESULTS', payload: results }), [])
  const clearResults = useCallback(() => dispatch({ type: 'CLEAR_RESULTS' }), [])
  const unlock = useCallback(() => dispatch({ type: 'UNLOCK' }), [])
  const vote = useCallback((modelId, vote) => dispatch({ type: 'VOTE', modelId, vote }), [])
  const toggleMetric = useCallback((id) => dispatch({ type: 'TOGGLE_METRIC', id }), [])
  const setAllMetrics = useCallback((ids) => dispatch({ type: 'SET_ALL_METRICS', ids }), [])
  const triesRemaining = Math.max(0, 3 - state.triesUsed)
  const canEvaluate = state.isUnlocked || triesRemaining > 0
  return <AppContext.Provider value={{ selectedModels: state.selectedModels, results: state.results, isEvaluating: state.isEvaluating, triesRemaining, isUnlocked: state.isUnlocked, canEvaluate, manualVotes: state.manualVotes, selectedMetrics: state.selectedMetrics, selectModel, startEvaluation, setResults, clearResults, unlock, vote, toggleMetric, setAllMetrics }}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
