import { Mail, MessageCircle } from 'lucide-react'

const EMAIL = 'adiholkar555@gmail.com'
const PHONE = '9049850240'
const ENQUIRY_MSG = encodeURIComponent('Hi, I would like to enquire about the LLM Evaluation Dashboard.')

export default function Footer() {
  return (
    <footer className="bg-card rounded-xl border border-border p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-card-foreground">Contact Us</h3>
          <p className="text-xs text-muted-foreground mt-0.5">For inquiries, feedback, or support</p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={`mailto:${EMAIL}`}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium cursor-pointer"
          >
            <Mail className="w-4 h-4" />
            <span className="hidden sm:inline">Email</span>
          </a>
          <a
            href={`https://wa.me/${PHONE}?text=${ENQUIRY_MSG}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600/10 text-green-600 hover:bg-green-600/20 transition-colors text-sm font-medium cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="hidden sm:inline">WhatsApp</span>
          </a>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-border text-center">
        <p className="text-xs text-muted-foreground">
          Built with ❤️ by Aditya Holkar
        </p>
      </div>
    </footer>
  )
}
