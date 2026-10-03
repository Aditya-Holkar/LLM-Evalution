import { createContext, useContext, useReducer, useCallback, useEffect } from 'react'
import { METRICS, MODELS } from '../config/constants'

const AppContext = createContext(null)
const STORAGE_KEY = 'llm-eval-state'
const METRIC_IDS = METRICS.map((metric) => metric.id)
const DEFAULT_MODELS = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b']

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return { triesUsed: 0, isUnlocked: false, manualVotes: {}, selectedMetrics: METRIC_IDS, selectedModels: DEFAULT_MODELS }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      triesUsed: state.triesUsed,
      isUnlocked: state.isUnlocked,
      manualVotes: state.manualVotes,
      selectedMetrics: state.selectedMetrics,
      selectedModels: state.selectedModels,
      availableModels: state.availableModels || MODELS,
    }))
  } catch {}
}

const savedState = loadState()
const validMetrics = new Set(METRIC_IDS)
const allowedProviders = new Set(['Groq'])
const validModels = new Set(MODELS.map((model) => model.id))
const migratedMetrics = Array.isArray(savedState.selectedMetrics)
  ? savedState.selectedMetrics.filter((id) => validMetrics.has(id))
  : METRIC_IDS

const savedAvailableModels = Array.isArray(savedState.availableModels)
  ? savedState.availableModels.filter((model) => allowedProviders.has(model?.provider))
  : MODELS

const migratedModels = Array.isArray(savedState.selectedModels)
  ? savedState.selectedModels.filter((id) => validModels.has(id) || savedAvailableModels.some((model) => model.id === id))
  : DEFAULT_MODELS

const initialState = {
  selectedModels: migratedModels,
  availableModels: savedAvailableModels,
  results: [],
  isEvaluating: false,
  selectedMetrics: migratedMetrics.length ? migratedMetrics : METRIC_IDS,
  ...savedState,
}

initialState.selectedMetrics = migratedMetrics.length ? migratedMetrics : METRIC_IDS
initialState.selectedModels = migratedModels.length ? migratedModels : DEFAULT_MODELS
initialState.availableModels = savedAvailableModels

function reducer(state, action) {
  switch (action.type) {
    case 'SET_AVAILABLE_MODELS': {
      const availableModels = Array.isArray(action.models) ? action.models : MODELS
      const availableIds = new Set(availableModels.map((model) => model.id))
      const selectedModels = state.selectedModels.filter((id) => availableIds.has(id))
      return { ...state, availableModels, selectedModels: selectedModels.length ? selectedModels : availableModels.slice(0, 4).map((model) => model.id) }
    }
    case 'SELECT_MODEL': {
      const selectedModels = state.selectedModels.includes(action.id)
        ? state.selectedModels.filter((m) => m !== action.id)
        : [...state.selectedModels, action.id]
      return { ...state, selectedModels }
    }
    case 'START_EVALUATION': return { ...state, isEvaluating: true, results: [] }
    case 'SET_RESULTS': return { ...state, results: action.payload, isEvaluating: false, triesUsed: state.triesUsed + 1 }
    case 'UPDATE_RESULTS': return { ...state, results: action.payload }
    case 'CLEAR_RESULTS': return { ...state, results: [], isEvaluating: false }
    case 'UNLOCK': return { ...state, isUnlocked: true }
    case 'VOTE': return { ...state, manualVotes: { ...state.manualVotes, [action.modelId]: action.vote } }
    case 'TOGGLE_METRIC':
      return { ...state, selectedMetrics: state.selectedMetrics.includes(action.id) ? state.selectedMetrics.filter((m) => m !== action.id) : [...state.selectedMetrics, action.id] }
    case 'SET_ALL_METRICS': return { ...state, selectedMetrics: action.ids }
    default: return state
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  useEffect(() => { saveState(state) }, [state.triesUsed, state.isUnlocked, state.manualVotes, state.selectedMetrics, state.selectedModels, state.availableModels])
  const selectModel = useCallback((id) => dispatch({ type: 'SELECT_MODEL', id }), [])
  const setAvailableModels = useCallback((models) => dispatch({ type: 'SET_AVAILABLE_MODELS', models }), [])
  const startEvaluation = useCallback(() => dispatch({ type: 'START_EVALUATION' }), [])
  const setResults = useCallback((results) => dispatch({ type: 'SET_RESULTS', payload: results }), [])
  const updateResults = useCallback((results) => dispatch({ type: 'UPDATE_RESULTS', payload: results }), [])
  const clearResults = useCallback(() => dispatch({ type: 'CLEAR_RESULTS' }), [])
  const unlock = useCallback(() => dispatch({ type: 'UNLOCK' }), [])
  const vote = useCallback((modelId, vote) => dispatch({ type: 'VOTE', modelId, vote }), [])
  const toggleMetric = useCallback((id) => dispatch({ type: 'TOGGLE_METRIC', id }), [])
  const setAllMetrics = useCallback((ids) => dispatch({ type: 'SET_ALL_METRICS', ids }), [])
  const triesRemaining = Math.max(0, 3 - state.triesUsed)
  const canEvaluate = state.isUnlocked || triesRemaining > 0

  return (
    <AppContext.Provider value={{
      selectedModels: state.selectedModels,
      availableModels: state.availableModels,
      results: state.results,
      isEvaluating: state.isEvaluating,
      triesRemaining,
      canEvaluate,
      isUnlocked: state.isUnlocked,
      manualVotes: state.manualVotes,
      selectedMetrics: state.selectedMetrics,
      selectModel,
      setAvailableModels,
      startEvaluation,
      setResults,
      updateResults,
      clearResults,
      unlock,
      vote,
      toggleMetric,
      setAllMetrics,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}

export const MAX_FREE_TRIES = 3
