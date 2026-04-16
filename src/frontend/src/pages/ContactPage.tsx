import { Clock, MapPin, Phone } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-14">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Contact Us</h1>
      <p className="text-gray-500 mb-10">
        We're here to help. Reach out to us anytime.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-[#E6F4EE] rounded-lg flex items-center justify-center shrink-0">
                <MapPin size={20} className="text-[#2F8F66]" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Store Address
                </h3>
                <p className="text-gray-600 text-sm">
                  Shop No. 5, Bhurj Mastana,
                  <br />
                  Near Devbhoomi Hospital,
                  <br />
                  Behind Bhoomi Park,
                  <br />
                  New Vavol, Gandhinagar
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-[#E6F4EE] rounded-lg flex items-center justify-center shrink-0">
                <Phone size={20} className="text-[#2F8F66]" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Phone Number
                </h3>
                <a
                  href="tel:9510463565"
                  className="text-[#2F8F66] font-semibold text-lg"
                >
                  9510463565
                </a>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-[#E6F4EE] rounded-lg flex items-center justify-center shrink-0">
                <Clock size={20} className="text-[#2F8F66]" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Opening Hours
                </h3>
                <p className="text-gray-600 text-sm">
                  Monday – Saturday: 8:00 AM – 9:00 PM
                </p>
                <p className="text-gray-600 text-sm">
                  Sunday: 9:00 AM – 6:00 PM
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-4">Send Us a Message</h3>
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label
                htmlFor="contact-name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Name
              </label>
              <input
                id="contact-name"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2F8F66]/30"
                placeholder="Your name"
              />
            </div>
            <div>
              <label
                htmlFor="contact-phone"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Phone
              </label>
              <input
                id="contact-phone"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2F8F66]/30"
                placeholder="Your phone number"
              />
            </div>
            <div>
              <label
                htmlFor="contact-message"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Message
              </label>
              <textarea
                id="contact-message"
                rows={4}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2F8F66]/30"
                placeholder="Your message"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-[#2F8F66] text-white py-3 rounded-lg font-semibold hover:bg-[#27795a] transition-colors"
            >
              Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
