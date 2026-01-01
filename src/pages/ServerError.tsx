import { Link } from 'react-router-dom';
import { buttonVariants } from '../components/ui/button';

export default function ServerError() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <main className="flex-grow flex flex-col items-center justify-center p-4">
        <div className="max-w-md text-center">
          <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
            <span className="text-4xl">⚠️</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Server Error</h1>
          <p className="text-gray-600 mb-8">
            Something went wrong on our end. Please try again later.
          </p>
          <Link
            to="/"
            className={`${buttonVariants({ variant: 'default' })} px-6 py-3`}
          >
            Go back home
          </Link>
        </div>
      </main>
    </div>
  );
}