"use client"

import { useState, useEffect } from "react"
import { Plus, Edit2, Trash2, Image, X } from "lucide-react"
import {
  uploadQuoteImageToCloudinary,
  addQuoteToFirestore,
  updateQuoteInFirestore,
  deleteQuoteFromFirestore,
  getQuotesFromFirestore,
} from "../Database/Firebase" // Import Firestore functions

function AdminQuote() {
  const [quotes, setQuotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentQuote, setCurrentQuote] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Form states
  const [quoteImage, setQuoteImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)

  // Load data from Firestore
  useEffect(() => {
    const fetchQuotes = async () => {
      try {
        const fetchedQuotes = await getQuotesFromFirestore() // Fetch quotes from Firestore
        setQuotes(fetchedQuotes)
        setLoading(false)
      } catch (error) {
        console.error("Error fetching quotes:", error)
        setLoading(false)
      }
    }

    fetchQuotes()
  }, [])

  // Reset form state
  const resetForm = () => {
    setQuoteImage(null)
    setImagePreview(null)
    setCurrentQuote(null)
  }

  // Handle file selection
  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setQuoteImage(file)

      // Create preview
      const reader = new FileReader()
      reader.onload = () => setImagePreview(reader.result)
      reader.readAsDataURL(file)
    }
  }

  // Handle add form submission
  const handleAddQuote = async (e) => {
    e.preventDefault()

    if (!quoteImage) {
      alert("Please select an image")
      return
    }

    const imageUrl = await uploadQuoteImageToCloudinary(quoteImage) // Upload image to Cloudinary

    if (!imageUrl) {
      alert("Failed to upload image")
      return
    }

    const newQuote = {
      src: imageUrl, // Use the Cloudinary URL
      alt: "Quote Image", // Default alt text
    }

    await addQuoteToFirestore(newQuote) // Add the quote to Firestore
    setQuotes([...quotes, newQuote]) // Update local state
    resetForm()
    setShowAddModal(false)
  }

  // Handle edit form submission
  const handleEditQuote = async (e) => {
    e.preventDefault()

    if (!currentQuote) return

    const imageUrl = quoteImage ? await uploadQuoteImageToCloudinary(quoteImage) : currentQuote.src // Upload new image if there's one selected

    if (!imageUrl) {
      alert("Failed to upload image")
      return
    }

    const updatedQuote = {
      src: imageUrl, // Update with the new Cloudinary URL if image was changed
      alt: "Quote Image", // Default alt text
    }

    await updateQuoteInFirestore(currentQuote.id, updatedQuote) // Update Firestore
    setQuotes(quotes.map((quote) => (quote.id === currentQuote.id ? updatedQuote : quote))) // Update local state
    resetForm()
    setShowEditModal(false)
  }

  // Handle delete confirmation
  const handleDeleteQuote = async () => {
    if (!currentQuote) return

    await deleteQuoteFromFirestore(currentQuote.id) // Delete from Firestore
    setQuotes(quotes.filter((quote) => quote.id !== currentQuote.id)) // Update local state
    setShowDeleteConfirm(false)
    setCurrentQuote(null)
  }

  // Set up quote for editing
  const openEditModal = (quote) => {
    setCurrentQuote(quote)
    setImagePreview(quote.src)
    setShowEditModal(true)
  }

  // Set up quote for deletion
  const openDeleteModal = (quote) => {
    setCurrentQuote(quote)
    setShowDeleteConfirm(true)
  }

  // QuoteForm component for reuse
  const QuoteForm = ({ title, onSubmit, submitText, onCancel }) => (
    <div className="bg-white rounded-lg max-w-md w-full p-6">
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      <form onSubmit={onSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Quote Image</label>
          <div className="flex items-center space-x-2">
            <label className="flex items-center gap-2 cursor-pointer border rounded-lg py-2 px-4 bg-gray-50 hover:bg-gray-100 transition">
              <Image size={18} />
              <span>Browse files</span>
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>
            {quoteImage && <span className="text-sm text-gray-500">{quoteImage.name}</span>}
          </div>
          {imagePreview && (
            <div className="mt-2 relative pt-[60%]">
              <img
                src={imagePreview || "/placeholder.svg"}
                alt="Preview"
                className="absolute inset-0 w-full h-full object-contain border rounded"
              />
            </div>
          )}
        </div>
        <div className="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-1.5 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition duration-300"
          >
            <X size={16} />
            Cancel
          </button>
          <button
            type="submit"
            className="flex items-center gap-1.5 bg-black text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition duration-300"
          >
            {submitText}
          </button>
        </div>
      </form>
    </div>
  )

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto rounded-lg ">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-gray-800 font-cousine">QUOTE MANAGEMENT</h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 bg-black hover:bg-gray-800 text-white py-2 px-4 rounded-lg transition duration-300"
          >
            <Plus size={18} />
            Add New Quote
          </button>
        </div>

        {loading ? (
          <div className="min-h-screen flex flex-col items-center justify-center">
            <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin mb-4"></div>
            <h2 className="text-xl font-bold text-gray-700">Loading Quotes...</h2>
          </div>
        ) : quotes.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No quotes found. Add your first quote!</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quotes.map((quote, index) => (
              <div
                key={index}
                className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition duration-300"
              >
                <div className="relative pt-[75%]">
                  <img
                    src={quote.src || "/placeholder.svg"}
                    alt="Quote image"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => openEditModal(quote)}
                      className="flex-1 flex justify-center items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-3 rounded text-sm transition duration-300"
                    >
                      <Edit2 size={14} />
                      Edit
                    </button>
                    <button
                      onClick={() => openDeleteModal(quote)}
                      className="flex-1 flex justify-center items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 py-2 px-3 rounded text-sm transition duration-300"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Quote Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <QuoteForm
            title="Add New Quote"
            onSubmit={handleAddQuote}
            submitText={
              <>
                <Plus size={16} />
                Add Quote
              </>
            }
            onCancel={() => {
              setShowAddModal(false)
              resetForm()
            }}
          />
        </div>
      )}

      {/* Edit Quote Modal */}
      {showEditModal && currentQuote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <QuoteForm
            title="Edit Quote"
            onSubmit={handleEditQuote}
            submitText={
              <>
                <Edit2 size={16} />
                Update Quote
              </>
            }
            onCancel={() => {
              setShowEditModal(false)
              resetForm()
            }}
          />
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && currentQuote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-sm w-full p-6">
            <h2 className="text-xl font-bold mb-4">Confirm Deletion</h2>
            <p className="mb-6">Are you sure you want to delete this quote? This action cannot be undone.</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setCurrentQuote(null)
                }}
                className="flex items-center gap-1.5 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition duration-300"
              >
                <X size={16} />
                Cancel
              </button>
              <button
                onClick={handleDeleteQuote}
                className="flex items-center gap-1.5 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition duration-300"
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminQuote

