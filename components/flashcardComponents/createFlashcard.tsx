'use client'

import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { useMutation } from "convex/react"
import { useState } from "react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog"
import { Check, Loader2, Plus, X } from "lucide-react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Textarea } from "../ui/textarea"
import { Switch } from "../ui/switch"

interface CreateflashcardProps {
    open:boolean
    onOpenChange:(open:boolean)=>void
    folderId:Id<'folders'>
}



const Createflashcard = ({open,onOpenChange,folderId}:CreateflashcardProps) => {
    const createflashcard = useMutation(api.flashcards.createFlashcard);
    const [loading, setLoading] = useState(false);
    const [question,setQuestion] = useState("")
    const [isMultipleChoice, setIsMultipleChoice] = useState(false);
    
    // --- FIX #1: Initialize answers with one default item ---
    const [answers, setAnswers] = useState<{ text: string; isCorrect: boolean }[]>([
      { text: '', isCorrect: true } // This is the default state for a text-based answer
    ]);

    //function to add answer
    const handleAddAnswer = () => {
        if(answers.length < 6){
            setAnswers([...answers, { text: '', isCorrect: false }]);
        }else {
            toast.error("You can't add more than 6 answers");
        }
    }
    const handleRemoveAnswer = (index: number) => {
        if(answers.length > 1){
            setAnswers(answers.filter((_, i) => i !== index));
        }
    }
    const handleAnswerTextChange = (index: number, text: string) => {
        const newAnswers = [...answers]
        newAnswers[index].text = text
        setAnswers(newAnswers)
    }
    const handleAnswerCorrectToggle = (index: number) => {
        const newAnswers = [...answers]
        if(isMultipleChoice){
            newAnswers.forEach((answer, i) => {
                answer.isCorrect =  i === index
            })
        }else {
            // For non-multiple choice, allow multiple correct answers
            newAnswers[index].isCorrect = !newAnswers[index].isCorrect
        }
        setAnswers(newAnswers)
    }

    const handleModeToggle = (checked:boolean)=>{
          setIsMultipleChoice(checked);
          if(checked){
            // When switching TO multiple choice
            if(answers.length < 2){
                setAnswers([{
                    text:'',
                    isCorrect:true
                
                },{
                    text:'',
                    isCorrect:false
            }])
            }else  {
            //ensure only one answer is marked correct
            const newAnswer = answers.map((answer,i)=>({
                ...answer,
                isCorrect:i === 0
            }))
            setAnswers(newAnswer)
          }
          }else{
            // When switching OFF multiple choice
            setAnswers([{
                text:answers[0].text||'', // Keep text if it exists
                isCorrect:true // Default to correct
            }])
          }
    }
    const handleSave = async ()=>{
        setLoading(true)
        if(!question.trim()){
            toast.error("Please enter a question")
            setLoading(false)
            return
        }
        // Filter out answers that are just whitespace
        const validAnswers = answers
          .map(a => ({ ...a, text: a.text.trim() }))
          .filter(a => a.text !== '');
          
        if(validAnswers.length === 0){
            toast.error("Please enter at least one answer")
            setLoading(false)
            return
        }
        if(isMultipleChoice && validAnswers.length < 2){
            toast.error("Please enter at least two answers")
            setLoading(false)
            return
        }
        const hasCorrectAnswer = validAnswers.some(a=>a.isCorrect)
        if(!hasCorrectAnswer){
           
            if (!isMultipleChoice) {
              validAnswers.forEach(a => a.isCorrect = true);
            } else {
              toast.error("Please mark at least one answer as correct");
              setLoading(false);
              return;
            }
        }
        try {
           await createflashcard({
            folderId:folderId,
            question:question,
            answers:validAnswers,
            isMultipleChoice:isMultipleChoice
           }) 
           toast.success("Flashcard created")
           handleClose() // This will reset state and call onOpenChange(false)
        } catch (error) {
           console.log(error);
           toast.error("Something went wrong")
        } finally {
            setLoading(false) 
        }
    }
    
    const handleClose =()=>{
        setQuestion("")
        setIsMultipleChoice(false)
        // --- FIX #2: Reset answers to the default state, not an empty array ---
        setAnswers([{ text: '', isCorrect: true }])
        onOpenChange(false)
    }
  return (
     <Dialog open={open} onOpenChange={handleClose} >
         <DialogContent className="sm:max-w-[600px] max-h-[calc(100vh-2rem)] overflow-y-auto scrollbar-hidden" >
            <DialogHeader>
                <DialogTitle className="text-2xl font-semibold" >Create flashcard</DialogTitle>
                <DialogDescription>
                    Add a new flashcard to help you study
                </DialogDescription>
            </DialogHeader>
           <div className="space-y-6 py-4">
          {/* Question Field */}
          <div className="space-y-2">
            <Label htmlFor="question">Question</Label>
            <Textarea
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Enter your question..."
              className="min-h-[100px]"
            />
          </div>

          {/* Multiple Choice Toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="multiple-choice" className="text-base">
                Multiple Choice
              </Label>
              <p className="text-sm text-muted-foreground">
                Enable to create a multiple choice question
              </p>
            </div>
            <Switch
              id="multiple-choice"
              checked={isMultipleChoice}
              onCheckedChange={handleModeToggle}
            />
          </div>

          {/* Answers Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>
                {isMultipleChoice ? 'Answer Options' : 'Correct Answer(s)'}
              </Label>
              {isMultipleChoice && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddAnswer}
                  disabled={answers.length >= 6}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Option
                </Button>
              )}
               {/* --- ADDED THIS --- */}
               {/* Add Answer button for non-multiple-choice */}
              {!isMultipleChoice && (
                 <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddAnswer}
                  disabled={answers.length >= 6}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Answer
                </Button>
              )}
            </div>

            <div className="space-y-3">
              {answers.map((answer, index) => (
                <div key={index} className="flex items-start gap-2">
                  {isMultipleChoice && (
                    <div className="flex items-center justify-center w-8 h-10 text-sm font-medium text-muted-foreground">
                      {String.fromCharCode(65 + index)}.
                    </div>
                  )}
                  <div className="flex-1">
                    <Input
                      value={answer.text}
                      onChange={(e) => handleAnswerTextChange(index, e.target.value)}
                      placeholder={isMultipleChoice ? `Option ${String.fromCharCode(65 + index)}` : 'Enter correct answer'}
                    />
                  </div>
                  <Button
                    type="button"
                    variant={answer.isCorrect ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => handleAnswerCorrectToggle(index)}
                    title={answer.isCorrect ? 'Correct answer' : 'Mark as correct'}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  {/* Show remove button if there's more than 1 answer */}
                  {answers.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveAnswer(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <p className="text-xs text-muted-foreground">
              {isMultipleChoice && 'You can add up to 6 options.'}
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Flashcard
          </Button>
        </DialogFooter>
         </DialogContent>
     </Dialog>
  )
}

export default Createflashcard