import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";


export const addVideo = mutation({
    args:{
        folderId:v.optional(v.id('folders')),
        title:v.string(),
    },
    handler: async(ctx , args)=>{
        const user = await ctx.auth.getUserIdentity()
        if (!user){
            throw Error ('Not authenticated')
        }
        const video = await ctx.db.insert('videos',{
            userId:user.subject,
            folderId:args.folderId,
            title:args.title,
            status:'generating',
        })

        return video
    }
})

export const updateVideo = mutation({
    args:{
        videoId:v.id('videos'),
        url:v.optional(v.string()),
        filesize:v.optional(v.number()),
        thumbnail:v.optional(v.string()),
        status:v.union(v.literal('ready'),v.literal('failed')),   
        title:v.optional(v.string()),
        description:v.optional(v.string()), 
    },
    handler: async (ctx,args)=>{
        const video = await ctx.db.get(args.videoId)
        if(!video){
            throw Error ('Video not found')
        }
        await ctx.db.patch(args.videoId,{
            url:args.url,
            filesize:args.filesize,
            thumbnail:args.thumbnail,
            status:args.status,
            title:args.title,
            description:args.description,
        })
    }
})

export const getvideos = query({
    args:{},
    handler: async (ctx)=>{
        const videos = await ctx.db.query('videos').collect();

        return videos
    }
})

export const getvideobyId = query({
    args:{
        videoId:v.id('videos')
    },
    handler: async (ctx ,args)=>{
        const video = await ctx.db.get(args.videoId)

        return video;
    }
})
export const fetchfoldervideos= query({
    args:{
        folderId:v.id('folders')
    },
    handler: async(ctx, args)=>{
        const videos = await ctx.db.query('videos').withIndex('by_folder',(q)=>q.eq('folderId',args.folderId)).collect()

        return videos
    },
})

export const schedulevideogeneration = mutation({
    args:{
        folderId:v.id('folders'),
        prompt:v.string(),
        context:v.string(),
    },
    handler: async (ctx,args)=>{
        const user = await ctx.auth.getUserIdentity()
        if (!user){
            throw Error ('Not authenticated')
        }
        const videoId = await ctx.db.insert('videos',{
            userId:user.subject,
            folderId:args.folderId,
            status:'generating',
        })
        console.log('generated a videoid...',videoId)
        await ctx.scheduler.runAfter(0, api.videos.generatevideo, {
        videoId:videoId,
        prompt: args.prompt,
        context: args.context,
    });
        return videoId        
    }
})

const videoschema = z.object({
    scenename: z.string(),
    transcript: z.string(),
    code: z.string(),
    title: z.string(),
    description: z.string(),
});

export const generatevideo = action({
    args:{
        videoId:v.id('videos'),
        prompt:v.string(),
        context:v.string(),
    },
    handler: async (ctx,args)=>{
        try {
            const generationPrompt = `
        You are VideoSage, an expert AI that generates flawless Manim code for educational math videos. Your code must be production-ready and follow strict patterns to avoid syntax errors. Read these rules carefully before generating any code
        CRITICAL RULES (Follow Exactly)
1. NO Unicode Characters - Use ASCII Only
❌ NEVER use: ✓ ✅ ✨ 📊 🎬 📹 or any emoji/non-ASCII characters
✅ ALWAYS use: [OK] [INFO] [ERROR] or plain text
2. NO Nested F-Strings
❌ WRONG: f"some text {f'another {var}'}"
✅ CORRECT: Build strings step-by-step or use .format()
3. Backslash Escaping (CRITICAL FOR WINDOWS)
When writing LaTeX in Python strings:

    Single backslash: \\
    Double backslash: \\\\
    Triple backslash: \\\\\\

❌ WRONG: r\"\\frac{x}{y}\"
✅ CORRECT: \"\\\\frac{x}{y}\"
4. Quote Usage Inside Code

    Use single quotes for outer strings: 'text here'
    Use double quotes for inner voiceover text: text=\"""\"Narration here\"\"\"
    Use triple double quotes for multi-line voiceover: """Long text"""
    5. Voiceover Pattern (MANDATORY)
Every scene must follow this exact structure:

with self.voiceover(text="""Your narration text here.
Can be multiple sentences.""") as tracker:
    # Animations here
    self.play(Write(some_object), run_time=2)

Do NOT:

    Use run_time inside voiceover() call
    Put empty lines inside the text="""...""" block
    Use single quotes for the voiceover text

API-Ready Scene Structure
Generate code that matches this template exactly:
from manim import *
from manim_voiceover import VoiceoverScene
import sys
import os

# Import the custom service
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from custom_google_tts import CustomGoogleService

class {scene_name}(VoiceoverScene):
    def construct(self):
        # Initialize Google TTS (DO NOT MODIFY)
        self.set_speech_service(
            CustomGoogleService(
                voice='en-US-Neural2-J',
                language_code='en-US',
                speaking_rate=0.90  # 0.85-0.95 is optimal for learning
            )
        )
        
        # SECTION 1: Title
        with self.voiceover(text="""Your narration here.
        Keep sentences concise. Focus on one concept at a time.""") as tracker:
            title = Text('TITLE HERE', font_size=56, color=BLUE)
            subtitle = Text('Subtitle', font_size=32, color=GRAY)
            subtitle.next_to(title, DOWN, buff=0.5)
            self.play(Write(title), run_time=2)
            self.play(FadeIn(subtitle, shift=DOWN), run_time=2)
        
        self.wait(1)
        self.play(FadeOut(title), FadeOut(subtitle))
        
        # SECTION 2: Main Content
        axes = Axes(x_range=[-2, 8, 1], y_range=[-1, 10, 1], x_length=10, y_length=6)
        axes_labels = axes.get_axis_labels(x_label='x', y_label='f(x)')
        
        with self.voiceover(text="""Explain your concept clearly.
        Use simple language. Reference the visual elements.""") as tracker:
            curve = axes.plot(lambda x: 0.15*x**2 - 0.5*x + 2, x_range=[0, 7], color=YELLOW)
            self.play(Create(axes), Write(axes_labels), run_time=2)
            self.play(Create(curve), run_time=3)
        
        self.wait(1)

Common Error Prevention Checklist
Before returning code, verify:

    [ ] No Unicode: Search for [^\x00-\x7F] and remove
    [ ] No raw strings with escaped quotes: r\"...\" is forbidden
    [ ] All LaTeX properly escaped: \\\\frac, \\\\lim, etc.
    [ ] Voiceover blocks closed: Every with self.voiceover(...) has matching self.wait() after
    [ ] Consistent quotes: Outer ', inner \"\"\"
    [ ] Class name is valid Python identifier: No spaces, starts with letter
    [ ] No trailing backslashes: Lines don't end with \

Educational Best Practices
Content Structure

    Hook (15s): Why should students care?
    Concept (45s): Visual explanation with narration
    Example (60s): Step-by-step walkthrough
    Practice (30s): Show multiple cases
    Summary (30s): Key takeaways

Narration Guidelines

    Sentence length: 10-15 words maximum
    Pacing: 120-150 words per minute (speaking_rate=0.90)
    Clarity: Define every term before using it
    Engagement: "Notice...", "Watch carefully...", "Let's see..."

Animation Timing

    Simple write/create: run_time=1.5-2
    Complex transforms: run_time=2.5-3
    Wait after animation: self.wait(0.5-1)
    Scene transitions: self.wait(2)

Example: Generating a Quadratic Formula Video
Request:
"Create a 90-second video explaining the quadratic formula"
Your Code Generation:
# NO - BAD CODE (has errors)
code = f"self.play(Write(MathTex(r'\\frac{{-b \\pm \\sqrt{{b^2-4ac}}}}{{2a}}')))"

# YES - GOOD CODE
code = '''
with self.voiceover(text="""The quadratic formula solves equations of the form a x squared plus b x plus c equals zero.""") as tracker:
    formula = MathTex("x = \\\\frac{-b \\\\pm \\\\sqrt{b^2-4ac}}{2a}", font_size=60)
    self.play(Write(formula), run_time=3)
'''

`;
    let prompt = ''
    const userrequest =`${args.prompt} provided context from pdf: ${args.context}`
    prompt = generationPrompt + userrequest + `
    `    
        const { object } = await generateObject({
            model: google("gemini-2.5-flash"),
            schema: videoschema,
            prompt: prompt,

        });
        
        console.log('sending code to api... ', object.code);
        
        const response = await fetch('https://manim-api-92080499980.us-central1.run.app/generate-video', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                scene_name: object.scenename,
                transcript: object.transcript,
                code: object.code
            })
        });
        if(!response.ok){
            throw Error ('Failed to generate video')
        }
        const data = await response.json()
        console.log('video generated successfully...', data)
        await ctx.runMutation(api.videos.updateVideo,{
            videoId: args.videoId,
            url: data.video_url,
            filesize: data.file_size,
            thumbnail: data.thumbnail_url,
            status: 'ready',
            title: object.title,
            description: object.description,
        })
        
            
        } catch (error) {
            console.log('video generation failed...', error);
             await ctx.runMutation(api.videos.updateVideo, {
            videoId: args.videoId,
            status: 'failed',
        });
        throw error
        }
    }
})