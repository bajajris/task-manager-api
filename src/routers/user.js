const express = require('express')
const User = require('../models/user')
const sharp = require('sharp')
const auth = require('../middleware/auth')
const multer = require('multer')
const { sendWelcomeEmail, sendCancellationEmail } = require('../emails/account')
const router = new express.Router()

router.post('/users', async (req, res) => {

    const user = new User(req.body)

    try {
        await user.save()
        sendWelcomeEmail(user.email, user.name)
        const token = await user.generateAuthToken()
        res.status(201).send({ user, token })
    } catch (e) {
        res.status(400).send(e)
    }

    // const user = new User(req.body)

    // user.save().then(() => {
    //     res.status(201).send(user)
    // }).catch((e) => {
    //     res.status(400).send(e)
    // })
    // console.log(req.body)
})

router.post('/users/login', async (req, res) => {

    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)

        const token = await user.generateAuthToken()

        res.send({ user: user, token: token })//stringifies json and whenever it stringifies it calls "toJSON" method that is in models
    } catch (e) {
        res.status(400).send()
    }
})

router.post('/users/logout', auth, async (req, res) => {

    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
        })
        await req.user.save()

        res.send()
    } catch (e) {
        console.log("Error")
        res.status(500).send(e)
    }
})

router.post('/users/logoutAll', auth, async (req, res) => {
    const arr = [1, 2, 3]
    try {
        req.user.tokens.splice(0, req.user.tokens.length)
        await req.user.save()

        res.send()
    } catch (e) {
        res.status(500).send(e)
    }
})

router.get("/users/me", auth, async (req, res) => {

    res.send(req.user)
    // try {
    //     const users = await User.find({})
    //     res.send(users)
    // } catch (e) {
    //     res.status(500).send(e)
    // }


    // User.find({}).then((users) => {
    //     res.send(users)
    // }).catch((e) => {
    //     res.status(500).send()
    // })
})

router.patch('/users/me', auth, async (req, res) => {

    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'email', "password", 'age']
    const isValidOperation = updates.every((update) => {
        return allowedUpdates.includes(update)
    })

    if (!isValidOperation) {
        return res.status(400).send({ error: "Invalid updates" })
    }

    // const _id = req.params.id
    try {

        // const user = await User.findById(_id)

        updates.forEach((update) => {
            req.user[update] = req.body[update] //cant use dot notation for object as we dont know what is in update
        })

        await req.user.save()
        // const user = await User.findByIdAndUpdate(_id, req.body, { new: true, runValidators: true })
        // if (!user) {
        //     return res.status(404).send()
        // }
        res.send(req.user)
    } catch (e) {
        res.status(500).send(e)
    }
})

router.delete('/users/me', auth, async (req, res) => {
    try {
        // const user = await User.findByIdAndDelete(req.user._id)
        // if (!user) {
        //     return res.status(404).send()
        // }
        await req.user.remove()
        sendCancellationEmail(req.user.email, req.user.name)
        res.send(req.user)
    } catch (e) {
        res.status(500).send(e)
    }
})

const upload = multer({
    // dest: 'avatars', // removed so that multer does not directly save to to the avatars directory and passed it to the function (req,res)
    limits: {
        fieldSize: 1000000
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|PNG)$/)) {
            return cb(new Error('Please upload jpg, jpeg or png'))
        }
        cb(undefined, true)
    }
})

router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    // req.file.buffer//gets uploaded file 
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer()
    req.user.avatar = buffer
    await req.user.save()
    res.send()
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message })
})

router.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined
    await req.user.save()
    res.send()
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message })
})

router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)

        if (!user || !user.avatar) {
            throw new Error()
        }

        res.set('Content-Type', 'image/png')
        res.send(user.avatar)

    } catch (e) {
        res.status(404).send()
    }
})

module.exports = router